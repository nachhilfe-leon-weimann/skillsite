import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Eyebrow } from "./eyebrow";
import { Lead, Text } from "./typography";

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
