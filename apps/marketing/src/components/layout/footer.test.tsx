import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Footer } from "./footer";

afterEach(cleanup);

test("every page's footer links the withdrawal function next to the legal links", () => {
  render(<Footer />);
  const footer = screen.getByRole("contentinfo");
  const link = within(footer).getByRole("link", { name: "Vertrag widerrufen" });
  expect(link.getAttribute("href")).toBe("/widerrufsrecht");
  // In the same row as the legal links.
  expect(
    within(link.parentElement!).getByRole("link", { name: "AGB" }),
  ).toBeTruthy();
});
