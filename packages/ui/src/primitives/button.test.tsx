import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Button, LinkButton } from "./button";

afterEach(cleanup);

test("a button renders as a button with the primary look by default", () => {
  render(<Button>Termin buchen</Button>);
  const button = screen.getByRole("button", { name: "Termin buchen" });
  expect(button.className).toContain("bg-coral-gradient");
});

test("an internal link button is a link to the route", () => {
  render(<LinkButton href="/termin">Termin</LinkButton>);
  expect(
    screen.getByRole("link", { name: "Termin" }).getAttribute("href"),
  ).toBe("/termin");
});

test("an external link button keeps the external href", () => {
  render(<LinkButton href="mailto:hallo@example.com">Mail</LinkButton>);
  expect(screen.getByRole("link", { name: "Mail" }).getAttribute("href")).toBe(
    "mailto:hallo@example.com",
  );
});
