import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Field, Input, Textarea } from "./field";

afterEach(cleanup);

test("without the slots a Field adds nothing to its control", () => {
  render(
    <Field label="Name" htmlFor="name" hint="(optional)">
      <Input id="name" />
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: /^Name/ });
  expect(
    [...input.attributes].map((attribute) => attribute.name).sort(),
  ).toEqual(["class", "id"]);
  expect(input.closest("div")?.children).toHaveLength(2);
});

test("description and error are announced with the control; an error marks it invalid", () => {
  render(
    <Field
      label="E-Mail"
      htmlFor="mail"
      description="Für die Bestätigung."
      error="Bitte eine E-Mail-Adresse angeben."
    >
      <Input id="mail" type="email" />
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "E-Mail" });
  expect(input.getAttribute("aria-invalid")).toBe("true");
  const [description, error] = (input.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);
  expect(description).toBe("Für die Bestätigung.");
  expect(error).toBe("Bitte eine E-Mail-Adresse angeben.");
  expect(screen.getByText("Bitte eine E-Mail-Adresse angeben.").className).toBe(
    "mt-1.5 text-caption font-semibold text-coral",
  );
});

test("required marks the control required and shows a marker assistive technology skips", () => {
  render(
    <Field label="Nachricht" htmlFor="message" required>
      <Textarea id="message" />
    </Field>,
  );
  const textarea = screen.getByRole("textbox", { name: "Nachricht" });
  expect(textarea.hasAttribute("required")).toBe(true);
  expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true");
});

test("a control's own state wins over the Field's", () => {
  render(
    <Field label="Telefon" htmlFor="tel" error="Fehlt.">
      <Input id="tel" aria-invalid={false} aria-describedby="eigene" />
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Telefon" });
  expect(input.getAttribute("aria-invalid")).toBe("false");
  expect(input.getAttribute("aria-describedby")).toBe("eigene");
});
