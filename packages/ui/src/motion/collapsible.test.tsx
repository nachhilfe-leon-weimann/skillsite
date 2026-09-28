import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AnimatedHeight } from "./animated-height";
import { Collapsible } from "./collapsible";

let notifyResize: () => void = () => {};
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("a closed Collapsible has zero rows and an inert, clipping panel", () => {
  render(
    <Collapsible open={false} id="panel" role="region">
      Antwort
    </Collapsible>,
  );
  const panel = screen.getByText("Antwort");
  expect(panel.id).toBe("panel");
  expect(panel.getAttribute("role")).toBe("region");
  expect(panel.hasAttribute("inert")).toBe(true);
  expect(panel.className).toBe("overflow-hidden");
  expect(panel.parentElement?.className).toBe(
    "grid transition-[grid-template-rows] duration-base ease-soft grid-rows-[0fr]",
  );
});

test("an open Collapsible has one full row and a live panel", () => {
  render(<Collapsible open>Antwort</Collapsible>);
  const panel = screen.getByText("Antwort");
  expect(panel.hasAttribute("inert")).toBe(false);
  expect(panel.parentElement?.className).toBe(
    "grid transition-[grid-template-rows] duration-base ease-soft grid-rows-[1fr]",
  );
});

test("AnimatedHeight follows the height of its content", () => {
  render(<AnimatedHeight className="p-4">Inhalt</AnimatedHeight>);
  const inner = screen.getByText("Inhalt");
  expect(inner.className).toBe("p-4");
  const outer = inner.parentElement!;
  expect(outer.className).toBe(
    "overflow-hidden motion-safe:transition-[height] motion-safe:duration-slow motion-safe:ease-soft",
  );
  expect(outer.style.height).toBe("");
  Object.defineProperty(inner, "offsetHeight", { value: 240 });
  act(() => notifyResize());
  expect(outer.style.height).toBe("240px");
});
