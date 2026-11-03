import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import * as eyebrow from "./eyebrow";
import { Eyebrow } from "./eyebrow";
import * as heading from "./heading";
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
      <Text tone="inverse-muted">Gedämpft</Text>
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
