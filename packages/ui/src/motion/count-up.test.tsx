import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { CountUp } from "./count-up";

beforeEach(() => {
  // Reduced motion: the counter rests on the end value, so the text is the stat itself.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The visible counter, not the invisible sizer that reserves its width. */
const counter = (container: HTMLElement) =>
  container.querySelector("span > span:not([aria-hidden])")?.textContent;

test.each(["4,8", "1.200+", "€ 12,50", "320+"])(
  "%s keeps its German notation under reduced motion",
  (value) => {
    const { container } = render(<CountUp value={value} />);
    expect(counter(container)).toBe(value);
  },
);

test("a value without a number renders verbatim", () => {
  const { container } = render(<CountUp value="24/7" />);
  expect(container.textContent).toBe("24/7");
});
