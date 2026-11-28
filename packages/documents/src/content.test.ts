/**
 * The legal Markdown in `content/` keeps every soft hyphen visible in a diff
 * (spec `docs/specs/documents.md`, "Frontmatter"): it is written as YAML's
 * `\u00AD` escape, never as the invisible character itself, which an editor
 * or a tool can slip in unseen.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const contentDir = path.join(import.meta.dirname, "..", "content");
const files = readdirSync(contentDir, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".md"))
  .sort();

test("the content directory holds the legal documents", () => {
  expect(files).toEqual(
    expect.arrayContaining(["agb.md", "datenschutz.md", "impressum.md"]),
  );
});

test.each(files)(
  "%s writes each soft hyphen as the escape \\u00AD, never as the invisible character",
  (file) => {
    const lines = readFileSync(path.join(contentDir, file), "utf8").split("\n");
    const literal = lines.flatMap((line, index) =>
      line.includes("\u00AD") ? [`${file}:${index + 1}`] : [],
    );
    expect(literal).toEqual([]);
  },
);
