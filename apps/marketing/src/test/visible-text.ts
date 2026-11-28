/**
 * The text a page shows, for the wording fixtures of the legal pages (spec
 * `docs/specs/documents.md`, "Rules of the arc"). jsdom layer: it parses the
 * markup with `DOMParser`.
 *
 * - A block boundary (the tags in `BLOCK`, and `<br>`) separates text; an
 *   inline boundary adds nothing, so `a<b>b</b>` reads `ab`.
 * - Every run of ASCII whitespace becomes one space, as a browser collapses it.
 *   Every other character stays as it is: U+00A0, U+202F and the soft hyphen
 *   U+00AD are wording too.
 * - Text in `<script>`, `<style>` and `<template>` is not shown and is skipped;
 *   all other text counts, whatever CSS would do with it.
 *
 * `visibleTextLines` puts each block's text on its own line, which keeps a
 * fixture file readable and its diffs small. `foldLines` joins the lines with
 * one space: the normalised text, where a block boundary is one space.
 */
const BLOCK = new Set([
  "P",
  "LI",
  "UL",
  "OL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "SECTION",
  "ARTICLE",
  "ASIDE",
  "NAV",
  "DIV",
  "ADDRESS",
  "HEADER",
  "FOOTER",
  "BR",
]);

const HIDDEN = new Set(["SCRIPT", "STYLE", "TEMPLATE"]);

/** ASCII whitespace as HTML defines it: space, tab, LF, FF, CR. */
const ASCII_WHITESPACE = /[ \t\n\f\r]+/g;

/** The text of `markup`, one line per block, each line collapsed and trimmed; empty lines dropped. */
export function visibleTextLines(markup: string): string[] {
  const { body } = new DOMParser().parseFromString(markup, "text/html");
  let text = "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += (node as Text).data.replace(ASCII_WHITESPACE, " ");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const { tagName } = node as Element;
    if (HIDDEN.has(tagName)) return;
    const block = BLOCK.has(tagName);
    if (block) text += "\n";
    node.childNodes.forEach(walk);
    if (block) text += "\n";
  };
  walk(body);

  return text
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").replace(/^ | $/g, ""))
    .filter((line) => line !== "");
}

/** The normalised text: the lines joined by one space each. */
export function foldLines(lines: readonly string[]): string {
  return lines.join(" ");
}
