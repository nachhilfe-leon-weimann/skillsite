import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Footer } from "./footer";

afterEach(cleanup);

test("every page's footer links the withdrawal function under contact", () => {
  render(<Footer />);
  const footer = screen.getByRole("contentinfo");
  const link = within(footer).getByRole("link", { name: "Vertrag widerrufen" });
  expect(link.getAttribute("href")).toBe("/widerrufsrecht");
  // In the contact column, next to the other ways to reach the provider.
  expect(
    within(link.parentElement!).getByRole("link", { name: "E-Mail" }),
  ).toBeTruthy();
});
