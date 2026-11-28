/**
 * Wording fixture of /impressum (spec `docs/specs/documents.md`, A2): the
 * page's visible text, captured from the JSX before the Impressum moves to
 * Markdown, so the move provably changes no word, punctuation mark, number or
 * label.
 *
 * `page.wording.txt` holds the text one block per line (`visibleTextLines`);
 * the test compares the normalised text, in which a block boundary is one
 * space. Only a deliberate wording change regenerates the fixture:
 *
 *   UPDATE_WORDING=1 pnpm --filter @skillsite/marketing exec vitest run src/app/impressum
 *
 * (Turbo passes no undeclared variable to its tasks, so `just test` cannot
 * regenerate it.) Then read the fixture's diff word by word before committing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { foldLines, visibleTextLines } from "@/test/visible-text";

import ImpressumPage from "./page";

const fixture = path.join(import.meta.dirname, "page.wording.txt");

test("/impressum shows the provider details word for word: hero and every section", () => {
  const lines = visibleTextLines(renderToStaticMarkup(<ImpressumPage />));
  if (process.env.UPDATE_WORDING === "1") {
    writeFileSync(fixture, `${lines.join("\n")}\n`);
  }
  const expected = readFileSync(fixture, "utf8").split("\n").filter(Boolean);

  // Equal folded text passes whatever the line breaks; a difference is shown line by line.
  if (foldLines(lines) !== foldLines(expected)) {
    expect(lines).toEqual(expected);
  }
  expect(foldLines(lines)).toBe(foldLines(expected));
});
