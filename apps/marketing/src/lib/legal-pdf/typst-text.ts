/*
 * Reads the paragraphs of a legal PDF from its Typst source, so a test can compare them with /agb without Typst
 * (which CI does not have). It understands exactly the markup legal-pdf/ uses and throws on anything else, so a new
 * construct cannot drop text silently:
 *
 * - paragraphs separated by blank lines; `= ` and `== ` headings
 * - `#include "<file>"`, also inside a call such as `#notice-box(include "<file>")`: the file's paragraphs
 * - `#<name>.<field>...`: a value of the generated data (`#provider.email`, `#agb.sections.termine.heading`)
 * - `#web-link(<address>)[<text>]`: the text; the address the PDF prints after it is PDF-only
 * - `#box-title[...]`, `#form-note[...]`: their text
 * - `#fill-line`, `#write-line`: lines to write on, no text
 * - `*strong*` and the escape `\*`
 * - whole lines of layout: `//` comments, `#import`, `#show`, `#set`, `#let`, `#v(...)`, `#pagebreak()`, also
 *   when their parentheses span several lines
 */

/** Calls whose content block is text. */
const TEXT_WRAPPERS = ["box-title", "form-note"];
/** Values without text. */
const LAYOUT_ATOMS = ["fill-line", "write-line"];
const LAYOUT_LINE = /^#(import|show|set|let|v|pagebreak)\b/;
const INCLUDE = /\binclude "([^"]+)"/;

/** Counts unclosed parentheses and brackets, to find where a multi-line layout line ends. */
function openBrackets(line: string): number {
  let depth = 0;
  for (const char of line) {
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth -= 1;
  }
  return depth;
}

/** Looks up `provider.email` or `agb.sections.termine.ref` in the generated data. */
function lookUp(data: unknown, reference: string): string {
  const value = reference
    .split(".")
    .reduce<unknown>(
      (node, key) =>
        node !== null && typeof node === "object"
          ? (node as Record<string, unknown>)[key]
          : undefined,
      data,
    );
  if (typeof value !== "string")
    throw new Error(`Typst reference #${reference} names no text in the data`);
  return value;
}

/** Resolves the inline markup of one paragraph to its text. */
function resolveInline(markup: string, data: unknown): string {
  let text = markup
    .replace(/#web-link\([^)]*\)\[([^\]]*)\]/g, "$1")
    .replace(
      new RegExp(`#(?:${TEXT_WRAPPERS.join("|")})\\[([^\\]]*)\\]`, "g"),
      "$1",
    )
    .replace(new RegExp(`#(?:${LAYOUT_ATOMS.join("|")})\\b`, "g"), "")
    .replace(/#([a-zA-Z]\w*(?:\.[a-zA-Z]\w*)+)/g, (_, reference: string) =>
      lookUp(data, reference),
    );
  const unknown = /#[\w-]+/.exec(text);
  if (unknown)
    throw new Error(
      `Unsupported Typst markup "${unknown[0]}" in: ${markup}. Teach src/lib/legal-pdf/typst-text.ts what it prints.`,
    );
  text = text
    .replace(/\\\*/g, "\u0000")
    .replace(/\*/g, "")
    .replace(/\u0000/g, "*");
  return text.replace(/^=+ /, "").replace(/\s+/g, " ").trim();
}

/**
 * The paragraphs of a Typst file, in order, with includes expanded and data resolved.
 *
 * @param file the file, relative to the root `read` resolves against
 * @param read returns a file's source
 * @param data the generated data the documents read
 */
export function typstParagraphs(
  file: string,
  read: (file: string) => string,
  data: unknown,
): string[] {
  const directory = file.includes("/")
    ? file.slice(0, file.lastIndexOf("/") + 1)
    : "";
  const paragraphs: string[] = [];
  let block: string[] = [];
  let layoutDepth = 0;

  const flush = () => {
    const text = resolveInline(block.join(" "), data);
    if (text) paragraphs.push(text);
    block = [];
  };

  for (const rawLine of read(file).split("\n")) {
    const line = rawLine.trim();
    if (layoutDepth > 0) {
      layoutDepth += openBrackets(line);
      continue;
    }
    if (line.startsWith("//")) continue;
    if (LAYOUT_LINE.test(line)) {
      layoutDepth = Math.max(0, openBrackets(line));
      // `#v(0.8em)` may share its line with nothing else; a layout line never carries text.
      continue;
    }
    const include = INCLUDE.exec(line);
    if (include) {
      flush();
      paragraphs.push(
        ...typstParagraphs(`${directory}${include[1]}`, read, data),
      );
      continue;
    }
    if (line === "") flush();
    else block.push(line);
  }
  flush();
  return paragraphs;
}
