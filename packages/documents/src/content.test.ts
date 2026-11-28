/**
 * The legal Markdown in `content/` keeps every soft hyphen visible in a diff
 * (spec `docs/specs/documents.md`, "Frontmatter"), never as the invisible
 * character itself, which an editor or a tool can slip in unseen. Each part of
 * a file has its own visible form: YAML's `­` escape in the frontmatter,
 * the character reference `&shy;` in the Markdown body. In the body, `­`
 * is no escape: the page would show those six characters.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const contentDir = path.join(import.meta.dirname, "..", "content");
const files = readdirSync(contentDir, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".md"))
  .sort();

/** A file's lines, each with its 1-based number and whether it is frontmatter. */
const linesOf = (file: string) => {
  const lines = readFileSync(path.join(contentDir, file), "utf8").split("\n");
  const close = lines[0] === "---" ? lines.indexOf("---", 1) : -1;
  return lines.map((text, index) => ({
    text,
    at: `${file}:${index + 1}`,
    frontmatter: index <= close,
  }));
};

test("the content directory holds the legal documents", () => {
  expect(files).toEqual(
    expect.arrayContaining(["agb.md", "datenschutz.md", "impressum.md"]),
  );
});

test.each(files)(
  "%s writes each soft hyphen visibly: YAML `\\u00AD` in the frontmatter, `&shy;` in the body, never the invisible character",
  (file) => {
    const lines = linesOf(file);
    expect(
      lines.filter(({ text }) => text.includes("­")).map(({ at }) => at),
    ).toEqual([]);
    expect(
      lines
        .filter(
          ({ text, frontmatter }) => !frontmatter && /\\u00ad/i.test(text),
        )
        .map(({ at }) => at),
    ).toEqual([]);
  },
);
