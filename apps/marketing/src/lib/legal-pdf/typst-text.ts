/*
 * Reads the paragraphs of a legal PDF from its Typst source, so a test can compare them with /agb without Typst
 * (which CI does not have). It understands exactly the markup legal-pdf/ uses and throws on anything else, so no
 * construct can print text the comparison does not see:
 *
 * - paragraphs separated by blank lines; `= ` and `== ` headings; `//` comments
 * - `#<name>.<field>...`: a value of the generated data (`#provider.email`, `#agb.sections.termine.heading`)
 * - `#web-link(<address>)[<text>]`: the text; the address the PDF prints after it is PDF-only
 * - `#box-title[...]`, `#form-note[...]`: their text
 * - `#fill-line`, `#write-line`: lines to write on, no text
 * - `*strong*` and the escape `\*`
 * - lines of their own: `#include "<file>"` or `#notice-box(include "<file>")`, which stand for the file's
 *   paragraphs; `#import "<file>": *`; `#v(<length>)`; `#pagebreak()`; `#set ...(...)` and the document's
 *   `#show: ...(...)`, whose parentheses may span several lines
 *
 * Show rules with a selector (`#show "Anbieter": ...`) and `#let` belong in template.typ, which this does not read.
 */

/** Calls whose content block is text. */
const TEXT_WRAPPERS = ["box-title", "form-note"];
/** Values without text. */
const LAYOUT_ATOMS = ["fill-line", "write-line"];
/** Whole lines without text. */
const LAYOUT_LINE = /^#(?:import "[^"]+": \*|v\([^()]*\)|pagebreak\(\))$/;
/** The start of a `#set` rule or the document's show-everything rule; it ends where its brackets close. */
const RULE_START = /^#(?:set [\w.-]+\(|show: [\w.-]+\()/;
const INCLUDE_LINE = /^#(?:include "([^"]+)"|notice-box\(include "([^"]+)"\))$/;

/** Counts unclosed parentheses and brackets. */
function openBrackets(line: string): number {
  let depth = 0;
  for (const char of line) {
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth -= 1;
  }
  return depth;
}

/** A line without its `//` comment (at the start or after a space). */
function stripComment(line: string): string {
  const comment = /(^|\s)\/\//.exec(line);
  return (comment ? line.slice(0, comment.index) : line).trim();
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
  const unknown = /#[\w-]*/.exec(text);
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
  let ruleDepth = 0;

  const flush = () => {
    const text = resolveInline(block.join(" "), data);
    if (text) paragraphs.push(text);
    block = [];
  };
  const fail = (line: string, reason: string): never => {
    throw new Error(`${file}: ${reason}: ${line}`);
  };

  for (const rawLine of read(file).split("\n")) {
    const line = stripComment(rawLine);
    if (ruleDepth > 0) {
      ruleDepth += openBrackets(line);
      if (ruleDepth < 0 || (ruleDepth === 0 && !/[)\]]$/.test(line)))
        fail(line, "text after a rule");
      continue;
    }
    if (line === "") {
      if (rawLine.trim() === "") flush();
      continue;
    }
    if (LAYOUT_LINE.test(line)) continue;
    if (RULE_START.test(line)) {
      ruleDepth = openBrackets(line);
      if (ruleDepth === 0 && !line.endsWith(")"))
        fail(line, "text after a rule");
      continue;
    }
    const include = INCLUDE_LINE.exec(line);
    if (include) {
      flush();
      paragraphs.push(
        ...typstParagraphs(
          `${directory}${include[1] ?? include[2]}`,
          read,
          data,
        ),
      );
      continue;
    }
    if (/^#(?:show|let|set|import|include)\b|\binclude\b/.test(line))
      fail(line, "markup this reader cannot follow");
    block.push(line);
  }
  if (ruleDepth !== 0) throw new Error(`${file}: a rule is never closed`);
  flush();
  return paragraphs;
}
