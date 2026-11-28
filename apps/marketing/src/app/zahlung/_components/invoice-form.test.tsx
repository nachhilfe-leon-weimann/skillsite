import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { InvoiceForm } from "./invoice-form";

afterEach(cleanup);

test("a plain GET form to /zahlung that works without JavaScript", () => {
  render(<InvoiceForm />);
  const field = screen.getByRole("textbox", { name: "Rechnungsnummer" });
  const form = field.closest("form")!;

  expect(form.getAttribute("method")).toBe("get");
  expect(form.getAttribute("action")).toBe("/zahlung");
  // The query the page reads: `?re=<number>`.
  expect(field.getAttribute("name")).toBe("re");
  expect(field.getAttribute("placeholder")).toBe("RE-1234");
  expect((field as HTMLInputElement).required).toBe(true);

  const submit = screen.getByRole("button", { name: "Weiter zu PayPal" });
  expect(submit.getAttribute("type")).toBe("submit");
  expect(submit.closest("form")).toBe(form);
});
