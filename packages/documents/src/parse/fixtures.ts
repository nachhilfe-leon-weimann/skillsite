/**
 * Synthetic documents for the parser tests. No real legal text: the tests
 * prove the parser's contract, the wording fixtures in the app prove the texts.
 */
import { expect } from "vitest";

import type { DocumentTree } from "../schema/index.ts";
import { parseDocument, parseDocuments } from "./document.ts";
import { DocumentError, type SourceFile } from "./sources.ts";

/** A valid frontmatter, field by field; a test overrides a field or drops it with `null`. */
const fields = {
  title: "Testbedingungen",
  shortTitle: "Test",
  badge: "Probe",
  lead: "Ein Lead.",
  description: "Eine Beschreibung.",
  version: "2026-07-14",
  effectiveDate: "2026-07-14",
  targets: "[web, pdf]",
  sections: "\n  numbered: true\n  nav: true",
};

export type Fields = Partial<
  Record<keyof typeof fields | (string & {}), string | null>
>;

export const FILE = "content/test.md";

/** A document: the frontmatter, a blank line, then `body`. */
export function source(body: string, overrides: Fields = {}): string {
  const lines = Object.entries({ ...fields, ...overrides })
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}

/** The line the body of `source(body)` starts on. */
export const BODY = source("").split("\n").length;

export interface Options {
  fields?: Fields;
  /** Partials by name, as `content/partials/<name>.md`. */
  partials?: Record<string, string>;
}

export function partialFiles(
  partials: Record<string, string> = {},
): Map<string, SourceFile> {
  return new Map(
    Object.entries(partials).map(([name, text]) => [
      name,
      { file: `content/partials/${name}.md`, source: text },
    ]),
  );
}

export function parse(body: string, options: Options = {}): DocumentTree {
  return parseDocument(
    { file: FILE, source: source(body, options.fields) },
    partialFiles(options.partials),
  ).tree;
}

/** The message of the build error `run` throws; fails the test when it throws none or another error. */
export function errorOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(DocumentError);
    return (error as DocumentError).message;
  }
  throw new Error("expected a build error, but the document parsed");
}

/** The build error of a synthetic document. */
export function parseError(body: string, options: Options = {}): string {
  return errorOf(() => parse(body, options));
}

export { parseDocuments };

/** The first section's blocks. */
export function blocksOf(tree: DocumentTree) {
  const [first] = tree.body;
  if (first?.type !== "section") throw new Error("the document has no section");
  return first.children;
}

/** A body of one section around `content`. */
export const inSection = (content: string) =>
  `## Abschnitt :anchor{#abschnitt}\n\n${content}\n`;

/** The line of `content`'s first line in `inSection(content)`. */
export const SECTION_BODY = BODY + 2;
