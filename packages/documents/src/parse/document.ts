import { labels } from "../labels.ts";
import { documentTreeSchema, type DocumentTree } from "../schema/index.ts";
import { convertBody } from "./convert.ts";
import { effectiveDateLabel, readFrontmatter } from "./frontmatter.ts";
import { loadFile, resolveIncludes, type IncludeRecord } from "./include.ts";
import { placeholderValues } from "./placeholders.ts";
import {
  DocumentError,
  Sources,
  type Location,
  type SourceFile,
} from "./sources.ts";

export interface ParsedDocument {
  tree: DocumentTree;
  /** The partials the document includes, with the place of each `::include`. */
  includes: IncludeRecord[];
}

/** A document's slug: its file name without `.md`. */
export function slugOf(file: string): string {
  return (file.split("/").at(-1) ?? file).replace(/\.md$/, "");
}

/**
 * Validates a finished tree against the registry. A failure names the place
 * in the source of the deepest node on the issue's path.
 */
export function validateTree(
  tree: unknown,
  locations: WeakMap<object, Location>,
  fallback: Location,
): DocumentTree {
  const result = documentTreeSchema.safeParse(tree);
  if (result.success) return result.data;

  const [issue] = result.error.issues;
  let place = fallback;
  let cursor: unknown = tree;
  for (const key of issue?.path ?? []) {
    if (cursor === null || typeof cursor !== "object") break;
    cursor = (cursor as Record<PropertyKey, unknown>)[key];
    const found =
      cursor !== null && typeof cursor === "object"
        ? locations.get(cursor)
        : undefined;
    if (found) place = found;
  }
  const path = issue?.path.join(".") || "the document";
  throw new DocumentError(
    place,
    `the tree fails the schema at ${path}: ${issue?.message ?? "invalid"}`,
  );
}

/**
 * Parses one document: frontmatter, partials, sections, directives and
 * placeholders, into a validated tree.
 */
export function parseDocument(
  document: SourceFile,
  partials: ReadonlyMap<string, SourceFile>,
): ParsedDocument {
  const sources = new Sources(document);
  const root = loadFile(document, sources);
  const frontmatter = readFrontmatter(root, document);
  const meta = {
    ...frontmatter,
    effectiveDateLabel: effectiveDateLabel(frontmatter.effectiveDate),
  };
  const includes = resolveIncludes(root, partials, sources);

  const locations = new WeakMap<object, Location>();
  const { body, nav } = convertBody(root, {
    sources,
    values: placeholderValues(meta),
    numbered: meta.sections.numbered,
    nav: meta.sections.nav,
    locations,
  });

  const start = { file: document.file, line: 1 };
  const tree = {
    slug: slugOf(document.file),
    meta,
    labels: {
      effectiveDate: labels.effectiveDate,
      contact: labels.contact,
      page: labels.page,
    },
    nav,
    body,
  };
  locations.set(tree, start);
  return { tree: validateTree(tree, locations, start), includes };
}

/**
 * Parses every document, keyed by slug. Documents that include the same
 * partial must agree on `version` and `effectiveDate`: the partial is one
 * text, so it has one date.
 */
export function parseDocuments(
  documents: readonly SourceFile[],
  partials: ReadonlyMap<string, SourceFile>,
): Record<string, DocumentTree> {
  const trees: Record<string, DocumentTree> = {};
  const firstIncluder = new Map<string, { file: string; tree: DocumentTree }>();

  for (const document of [...documents].sort((a, b) =>
    a.file.localeCompare(b.file),
  )) {
    const { tree, includes } = parseDocument(document, partials);
    for (const { name, at } of includes) {
      const first = firstIncluder.get(name);
      if (!first) {
        firstIncluder.set(name, { file: document.file, tree });
        continue;
      }
      const { version, effectiveDate } = first.tree.meta;
      if (
        tree.meta.version !== version ||
        tree.meta.effectiveDate !== effectiveDate
      ) {
        throw new DocumentError(
          at,
          `partial "${name}" is also included by ${first.file}, which has version ${version} and effectiveDate ${effectiveDate}; this document has ${tree.meta.version} and ${tree.meta.effectiveDate}`,
        );
      }
    }
    trees[tree.slug] = tree;
  }
  return trees;
}
