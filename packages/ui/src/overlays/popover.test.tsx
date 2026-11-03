import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

afterEach(cleanup);

function Example({
  initialOpen = false,
  onOpenChange,
  onCloseAutoFocus,
}: {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button>Davor</button>
      <Popover
        open={open}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          setOpen(next);
        }}
      >
        <PopoverTrigger>
          <button>Plattformen</button>
        </PopoverTrigger>
        <PopoverContent
          label="Plattformen"
          className="w-64"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <a href="#eins">Eins</a>
          <a href="#zwei">Zwei</a>
        </PopoverContent>
      </Popover>
      <button onClick={() => setOpen(false)}>Danach</button>
    </>
  );
}

test("names a non-modal dialog, links its trigger and keeps the page reachable", async () => {
  render(<Example />);
  const trigger = screen.getByRole("button", { name: "Plattformen" });
  expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Plattformen" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
  expect(dialog.hasAttribute("aria-modal")).toBe(false);
  expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Eins",
    "Zwei",
  ]);
  // Opening keeps focus on the trigger; the panel follows it in the DOM.
  expect(document.activeElement).toBe(trigger);
  expect(
    trigger.compareDocumentPosition(dialog) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(document.querySelector("[aria-hidden='true']:not(span)")).toBeNull();
  expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
  expect(screen.getByText("Eins").closest(".w-64")).not.toBeNull();
});

test("Tab at either edge of the panel is left to the browser: no focus loop", async () => {
  render(<Example initialOpen />);
  const [first, last] = await screen.findAllByRole("link");
  last!.focus();
  expect(fireEvent.keyDown(last!, { key: "Tab" })).toBe(true);
  first!.focus();
  expect(fireEvent.keyDown(first!, { key: "Tab", shiftKey: true })).toBe(true);
});

test("Escape closes once and focuses the trigger at once", async () => {
  const onOpenChange = vi.fn();
  render(<Example initialOpen onOpenChange={onOpenChange} />);
  const [first] = await screen.findAllByRole("link");
  first!.focus();
  fireEvent.keyDown(first!, { key: "Escape" });
  expect(onOpenChange).toHaveBeenCalledTimes(1);
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Plattformen" }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("Escape does not pull focus from elsewhere on the page", async () => {
  render(<Example initialOpen />);
  await screen.findByRole("dialog");
  const before = screen.getByRole("button", { name: "Davor" });
  before.focus();
  fireEvent.keyDown(before, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(before);
});

test("a controlled open and close never move focus held elsewhere", async () => {
  function Controlled({ open }: { open: boolean }) {
    return (
      <>
        <button>Davor</button>
        <Popover open={open} onOpenChange={() => {}}>
          <PopoverTrigger>
            <button>Plattformen</button>
          </PopoverTrigger>
          <PopoverContent label="Plattformen">
            <a href="#eins">Eins</a>
          </PopoverContent>
        </Popover>
      </>
    );
  }
  const { rerender } = render(<Controlled open={false} />);
  const before = screen.getByRole("button", { name: "Davor" });
  before.focus();
  rerender(<Controlled open />);
  await screen.findByRole("dialog");
  expect(document.activeElement).toBe(before);
  rerender(<Controlled open={false} />);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  expect(document.activeElement).toBe(before);
});

test("a controlled close while the panel holds focus restores the trigger, unless prevented", async () => {
  function Harness({ prevent }: { prevent: boolean }) {
    const [open, setOpen] = useState(true);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <button>Plattformen</button>
        </PopoverTrigger>
        <PopoverContent
          label="Plattformen"
          onCloseAutoFocus={(event) => {
            if (prevent) event.preventDefault();
          }}
        >
          <a href="#eins" onClick={() => setOpen(false)}>
            Eins
          </a>
        </PopoverContent>
      </Popover>
    );
  }
  for (const prevent of [false, true]) {
    const { unmount } = render(<Harness prevent={prevent} />);
    const link = await screen.findByRole("link", { name: "Eins" });
    link.focus();
    fireEvent.click(link);
    const trigger = screen.getByRole("button", { name: "Plattformen" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    if (prevent) expect(document.activeElement).not.toBe(trigger);
    else expect(document.activeElement).toBe(trigger);
    unmount();
  }
});
