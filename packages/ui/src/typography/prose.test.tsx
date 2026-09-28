import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import * as prose from "./prose";
import { InlineLink, ProseH2, ProseH3, ProseP } from "./prose";

afterEach(cleanup);

test("the prose module exports only the legal-text API", () => {
  expect(Object.keys(prose).sort()).toEqual([
    "InlineLink",
    "ProseH2",
    "ProseH3",
    "ProseP",
  ]);
});

test("prose headings and paragraphs render on the prose tokens", () => {
  render(
    <>
      <ProseH2>Geltungsbereich</ProseH2>
      <ProseH3>Vertragsschluss</ProseH3>
      <ProseP className="mt-6">Absatz</ProseP>
    </>,
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Geltungsbereich" })
      .className,
  ).toBe(
    "font-heading hyphens-heading text-prose-h2 font-bold tracking-tight text-ink",
  );
  expect(
    screen.getByRole("heading", { level: 3, name: "Vertragsschluss" })
      .className,
  ).toBe("font-heading hyphens-heading text-prose-h3 font-bold text-ink");
  expect(screen.getByText("Absatz").className).toBe(
    "text-prose-body text-ink mt-6",
  );
});

test("an inline link keeps its site and doc underline offsets", () => {
  render(
    <>
      <InlineLink href="/agb">AGB</InlineLink>
      <InlineLink variant="doc" href="/datenschutz">
        Datenschutz
      </InlineLink>
    </>,
  );
  expect(screen.getByRole("link", { name: "AGB" }).className).toContain(
    "underline-offset-4",
  );
  expect(screen.getByRole("link", { name: "Datenschutz" }).className).toContain(
    "underline-offset-[3px]",
  );
});
