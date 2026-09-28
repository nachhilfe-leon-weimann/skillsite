import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Logo } from "./logo";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

// next-themes reads the system preference; jsdom has no matchMedia.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const brand = {
  name: "Nachhilfe Leon Weimann",
  tagline: "Verstehen statt auswendig lernen.",
  src: "/logo-icon.png",
};

test("Logo renders the brand it is given, in its tone", () => {
  render(<Logo {...brand} tone="inverse" />);
  expect(screen.getByRole("img", { name: brand.name })).toBeTruthy();
  expect(screen.getByText(brand.name).className).toContain("text-white");
  expect(screen.getByText(brand.tagline).className).toContain(
    "text-on-navy-soft",
  );
});

test("Logo without text is the mark only", () => {
  render(<Logo {...brand} showText={false} />);
  expect(screen.queryByText(brand.tagline)).toBeNull();
});

test("ThemeToggle offers the light and dark override inside the provider", () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  const group = screen.getByRole("group", { name: "Farbschema wählen" });
  expect(group.querySelectorAll("button")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Hell" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Dunkel" })).toBeTruthy();
});
