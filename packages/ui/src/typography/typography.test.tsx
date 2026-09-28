import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import * as eyebrow from "./eyebrow";
import { Eyebrow } from "./eyebrow";
import * as heading from "./heading";
import { Heading } from "./heading";
import * as lead from "./lead";
import { Lead } from "./lead";
import * as prose from "./prose";
import * as text from "./text";
import { Text } from "./text";

afterEach(cleanup);

test("Lead keeps its size next to its muted tone", () => {
  render(<Lead>Einleitung</Lead>);
  expect(screen.getByText("Einleitung").className).toMatch(/\btext-lead\b/);
});

test("Text keeps small and caption sizes next to a tone", () => {
  render(
    <>
      <Text size="small" tone="muted">
        Klein
      </Text>
      <Text size="caption" tone="muted">
        Fußnote
      </Text>
    </>,
  );
  expect(screen.getByText("Klein").className).toMatch(/\btext-small\b/);
  expect(screen.getByText("Fußnote").className).toMatch(/\btext-caption\b/);
});

test("Eyebrow keeps its size next to its coral colour", () => {
  render(<Eyebrow>Fächer</Eyebrow>);
  const eyebrow = screen.getByText("Fächer");
  expect(eyebrow.className).toMatch(/\btext-eyebrow\b/);
  expect(eyebrow.className).toMatch(/\btext-coral\b/);
});

test("Text tones on inverse surfaces are named by role", () => {
  render(
    <>
      <Text tone="inverse">Hell</Text>
      <Text tone="inverse-soft">Gedämpft</Text>
    </>,
  );
  expect(screen.getByText("Hell").className).toBe("text-body text-on-navy");
  expect(screen.getByText("Gedämpft").className).toBe(
    "text-body text-on-navy-soft",
  );
});

test("the typography group exports one API", () => {
  expect(
    [eyebrow, heading, lead, prose, text].flatMap(Object.keys).sort(),
  ).toEqual([
    "Address",
    "Eyebrow",
    "Heading",
    "InlineLink",
    "Lead",
    "ProseH2",
    "ProseH3",
    "ProseP",
    "Text",
  ]);
});

test("a scale heading keeps its classes in their order", () => {
  render(<Heading>Titel</Heading>);
  expect(screen.getByRole("heading", { level: 2 }).className).toBe(
    "font-heading text-balance hyphens-heading text-h2",
  );
});

test("a card heading has a role size, the plain wrap and a tone", () => {
  render(
    <Heading
      as="h3"
      size="card-title"
      wrap="normal"
      tone="default"
      className="mt-5"
    >
      Mathematik
    </Heading>,
  );
  expect(screen.getByRole("heading", { level: 3 }).className).toBe(
    "font-heading text-card-title font-bold text-ink mt-5",
  );
});

test("Eyebrow has tones, an optional dot and an element", () => {
  render(
    <>
      <Eyebrow>Fächer</Eyebrow>
      <Eyebrow as="p" dot={false} tone="inverse-muted">
        Navigation
      </Eyebrow>
    </>,
  );
  const dotted = screen.getByText("Fächer");
  expect(dotted.className).toBe(
    "text-eyebrow uppercase inline-flex items-center gap-2.25 text-coral",
  );
  expect(dotted.firstElementChild?.className).toBe(
    "size-1.75 shrink-0 rounded-full bg-coral",
  );
  const plain = screen.getByText("Navigation");
  expect(plain.tagName).toBe("P");
  expect(plain.className).toBe("text-eyebrow uppercase text-on-navy-muted");
  expect(plain.children).toHaveLength(0);
});

test("the note size is fine print at its own token", () => {
  render(
    <Text size="note" tone="muted">
      Quelle
    </Text>,
  );
  expect(screen.getByText("Quelle").className).toBe("text-note text-ink-soft");
});
