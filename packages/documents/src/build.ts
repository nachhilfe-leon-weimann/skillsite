/**
 * The documents build: `content/*.md` (with `content/partials/*.md`) ->
 * `dist/documents.json` (every tree, keyed by slug) and `dist/meta.json`
 * (version and dates per slug, E-15). An error in a document prints its file
 * and line and exits non-zero.
 *
 *   node src/build.ts [--content <dir>] [--out <dir>]
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import {
  DocumentError,
  parseDocuments,
  slugOf,
  type SourceFile,
} from "./parse/index.ts";
import type { DocumentTree } from "./schema/index.ts";

const packageRoot = path.join(import.meta.dirname, "..");

/** The `.md` files of a directory, named relative to the content directory's parent ("content/agb.md"). */
function markdownFiles(dir: string, base: string): SourceFile[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const absolute = path.join(dir, name);
      return {
        file: path.relative(base, absolute).split(path.sep).join("/"),
        source: readFileSync(absolute, "utf8"),
      };
    });
}

/** Parses the content directory and writes the build output; returns the trees. */
export function buildDocuments({
  contentDir = path.join(packageRoot, "content"),
  outDir = path.join(packageRoot, "dist"),
} = {}): Record<string, DocumentTree> {
  if (!existsSync(contentDir)) {
    throw new Error(`no content directory at ${contentDir}`);
  }
  const base = path.dirname(contentDir);
  const documents = markdownFiles(contentDir, base);
  const partials = new Map(
    markdownFiles(path.join(contentDir, "partials"), base).map((file) => [
      slugOf(file.file),
      file,
    ]),
  );

  const trees = parseDocuments(documents, partials);
  const meta = Object.fromEntries(
    Object.entries(trees).map(([slug, tree]) => {
      const { version, effectiveDate, effectiveDateLabel } = tree.meta;
      return [slug, { version, effectiveDate, effectiveDateLabel }];
    }),
  );

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "documents.json"),
    `${JSON.stringify(trees, null, 2)}\n`,
  );
  writeFileSync(
    path.join(outDir, "meta.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
  return trees;
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: { content: { type: "string" }, out: { type: "string" } },
  });
  try {
    const trees = buildDocuments({
      contentDir: values.content && path.resolve(values.content),
      outDir: values.out && path.resolve(values.out),
    });
    const slugs = Object.keys(trees);
    console.log(
      `documents: ${slugs.length} built${slugs.length ? ` (${slugs.join(", ")})` : ""}`,
    );
  } catch (error) {
    if (!(error instanceof DocumentError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
}
