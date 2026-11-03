import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Button } from "./button";

afterEach(cleanup);

test("a button renders as a button with the primary look by default", () => {
  render(<Button>Termin buchen</Button>);
  const button = screen.getByRole("button", { name: "Termin buchen" });
  expect(button.className).toContain("bg-coral-gradient");
});

test("asChild renders the child element with the button's classes", () => {
  render(
    <Button asChild variant="outline" size="lg" className="mt-6">
      <a href="/termin">Termin</a>
    </Button>,
  );
  const link = screen.getByRole("link", { name: "Termin" });
  expect(link.getAttribute("href")).toBe("/termin");
  expect(screen.queryByRole("button")).toBeNull();
  expect(link.className).toBe(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60 border-[1.5px] border-line bg-transparent text-ink hover:border-ink px-6 py-3 text-button-lg mt-6",
  );
});

test("the class order is base, variant, size, then className", () => {
  render(
    <Button variant="secondary" size="sm" className="px-4">
      Mehr
    </Button>,
  );
  expect(screen.getByRole("button", { name: "Mehr" }).className).toBe(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60 bg-navy text-white hover:opacity-90 py-1.5 text-sm px-4",
  );
});
