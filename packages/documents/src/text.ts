/**
 * The text a document tree shows, block by block: the reference the wording
 * tests hold a renderer's output against (spec `docs/specs/documents.md`,
 * "Rules of the arc"), on the web (a page's `<article>`) and in the PDF.
 *
 * - Every block starts a line: a section's heading, a container's title, a
 *   paragraph, a list item, a link of a link list, a form line, a line of the
 *   contact address. A `break` ends a line, too.
 * - Inline content reads as it stands: a text's value and a link's text. A
 *   legal-basis box reads its label, a space, then its text.
 * - Every run of ASCII whitespace becomes one space and each line is trimmed,
 *   as a browser shows it; empty lines are dropped. Every other character,
 *   U+00A0 and U+00AD included, stays as it is.
 *
 * The map is typed over the registry, so a new node type has no text until it
 * gets one here.
 */
import type { BodyBlock, Inline, NodeOf, NodeType } from "./schema/index.ts";

type AnyNode = NodeOf<NodeType>;

/** A block's own line boundaries: the text between them is one line. */
const line = (text: string) => `\n${text}\n`;

const inlines = (nodes: readonly Inline[]) => nodes.map(textOf).join("");
const blocks = (nodes: readonly AnyNode[]) => nodes.map(textOf).join("");

const texts: { readonly [T in NodeType]: (node: NodeOf<T>) => string } = {
  section: (node) => line(node.heading) + blocks(node.children),
  subsection: (node) => line(node.title) + blocks(node.children),
  group: (node) => line(node.title) + blocks(node.children),
  paragraph: (node) => line(inlines(node.children)),
  list: (node) => node.items.map((item) => line(inlines(item))).join(""),
  legalBasis: (node) => line(`${node.label} ${inlines(node.children)}`),
  providerLink: (node) => line(node.text),
  linkList: (node) => node.links.map((link) => line(link.text)).join(""),
  detailGrid: (node) => blocks(node.children),
  detailList: (node) =>
    line(node.title) + node.items.map((item) => line(inlines(item))).join(""),
  entry: (node) => blocks(node.children),
  contactAddress: (node) => node.lines.map(line).join(""),
  panel: (node) => blocks(node.children),
  form: (node) => blocks(node.children),
  formLine: (node) => line(node.text),
  field: (node) => line(node.label),
  signature: (node) => line(node.label),
  formNote: (node) => line(node.text),
  text: (node) => node.value,
  break: () => "\n",
  link: (node) => node.text,
};

function textOf(node: AnyNode): string {
  // The map pairs every entry with its own node type; TypeScript cannot follow `node.type` into it.
  return (texts[node.type] as (node: AnyNode) => string)(node);
}

/** ASCII whitespace as HTML defines it, except the line feed that separates the lines here. */
const SPACES = /[ \t\f\r]+/g;

/** The text of a document's body, one line per block (see above). */
export function documentTextLines(body: readonly BodyBlock[]): string[] {
  return (
    blocks(body)
      .split("\n")
      // Not `trim()`: it would take U+00A0 and the other Unicode spaces as well.
      .map((text) => text.replace(SPACES, " ").replace(/^ | $/g, ""))
      .filter((text) => text !== "")
  );
}
