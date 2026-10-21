import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useState } from "react";

import { Dialog } from "./dialog";

afterEach(cleanup);

function Contents() {
  return (
    <>
      <h2 id="title">Angaben</h2>
      <p id="description">Beschreibung</p>
      <input aria-label="Name" />
      <button>Weiter</button>
    </>
  );
}

test("preserves external label/description IDs, controlled state and panel classes", async () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <Dialog open={false} onClose={onClose}>
      <Contents />
    </Dialog>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  rerender(
    <Dialog
      open
      onClose={onClose}
      labelledBy="title"
      describedBy="description"
      className="max-w-none"
    >
      <Contents />
    </Dialog>,
  );
  const dialog = await screen.findByRole("dialog", {
    name: "Angaben",
    description: "Beschreibung",
  });
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(dialog.classList.contains("max-w-none")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  expect(onClose).not.toHaveBeenCalled();
  rerender(
    <Dialog open={false} onClose={onClose}>
      <Contents />
    </Dialog>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
});

test("an onClose identity change does not reset focus and Escape calls the latest callback once", async () => {
  const first = vi.fn();
  const latest = vi.fn();
  const { rerender } = render(
    <Dialog open onClose={first} labelledBy="title">
      <Contents />
    </Dialog>,
  );
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole("textbox")),
  );
  const next = screen.getByRole("button", { name: "Weiter" });
  next.focus();
  rerender(
    <Dialog open onClose={latest} labelledBy="title">
      <Contents />
    </Dialog>,
  );
  expect(document.activeElement).toBe(next);
  fireEvent.keyDown(next, { key: "Escape" });
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledTimes(1);
});

// Upstream regression: https://github.com/radix-ui/primitives/issues/4143.
// Fire inside the library's registration window, before its render snapshot updates.
test("Escape during child layer registration never dismisses the parent", () => {
  const parentClose = vi.fn();
  function Nested() {
    const [nested, setNested] = useState(false);
    return (
      <Dialog open onClose={parentClose} labelledBy="parent-title">
        <h2 id="parent-title">Eltern</h2>
        <button onClick={() => setNested(true)}>Kind öffnen</button>
        <Dialog
          open={nested}
          onClose={() => setNested(false)}
          labelledBy="child-title"
        >
          <h2 id="child-title">Kind</h2>
          <button>Zurück</button>
        </Dialog>
      </Dialog>
    );
  }
  render(<Nested />);
  const dispatchEscape = vi.fn(() =>
    fireEvent.keyDown(document, { key: "Escape" }),
  );
  document.addEventListener("dismissableLayer.update", dispatchEscape, {
    once: true,
  });
  try {
    fireEvent.click(screen.getByRole("button", { name: "Kind öffnen" }));
  } finally {
    document.removeEventListener("dismissableLayer.update", dispatchEscape);
  }
  expect(dispatchEscape).toHaveBeenCalledTimes(1);
  expect(parentClose).not.toHaveBeenCalled();
});
