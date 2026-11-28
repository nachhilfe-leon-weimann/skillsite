import type { Parent, Root } from "mdast";
import type { LeafDirective } from "mdast-util-directive";

import { guardDirectives } from "./guard.ts";
import { parseMarkdown } from "./markdown.ts";
import type { Location, SourceFile, Sources } from "./sources.ts";

/** A partial a document includes, and where. */
export interface IncludeRecord {
  name: string;
  at: Location;
}

/** One file's syntax tree, checked by the directive guard; its nodes know their file. */
export function loadFile(file: SourceFile, sources: Sources): Root {
  const tree = parseMarkdown(file.source);
  guardDirectives(tree, file);
  sources.register(tree, file);
  return tree;
}

/** The partial `::include{src="name"}` names. */
function includeName(node: LeafDirective, sources: Sources): string {
  const attributes = node.attributes ?? {};
  const unknown = Object.keys(attributes).find((key) => key !== "src");
  if (node.children.length > 0 || unknown !== undefined) {
    throw sources.error(
      node,
      '::include takes only a source: ::include{src="name"}',
    );
  }
  const name = attributes.src ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw sources.error(
      node,
      '::include names a partial by its file name: ::include{src="widerruf"} for content/partials/widerruf.md',
    );
  }
  return name;
}

/**
 * Replaces every `::include{src="name"}` with the body of the partial
 * `content/partials/<name>.md`, in place and recursively. A missing partial,
 * a partial included twice and a partial that includes itself fail. A partial
 * carries no frontmatter: the documents that include it set its version and
 * date (`parseDocuments` checks that they agree).
 */
export function resolveIncludes(
  tree: Root,
  partials: ReadonlyMap<string, SourceFile>,
  sources: Sources,
): IncludeRecord[] {
  const records: IncludeRecord[] = [];

  const expand = (parent: Parent, stack: readonly string[]) => {
    for (let index = 0; index < parent.children.length; index++) {
      const child = parent.children[index]!;
      if (child.type !== "leafDirective" || child.name !== "include") {
        if ("children" in child) expand(child, stack);
        continue;
      }

      const name = includeName(child, sources);
      if (stack.includes(name)) {
        throw sources.error(
          child,
          `partial "${name}" includes itself: ${[...stack, name].join(" -> ")}`,
        );
      }
      const first = records.find((record) => record.name === name);
      if (first) {
        throw sources.error(
          child,
          `partial "${name}" is included twice; first at ${first.at.file}:${first.at.line}`,
        );
      }
      const partial = partials.get(name);
      if (!partial) {
        throw sources.error(
          child,
          `no partial "${name}" in content/partials/ (${name}.md)`,
        );
      }
      records.push({ name, at: sources.locate(child) });

      const body = loadFile(partial, sources);
      const [head] = body.children;
      if (head?.type === "yaml") {
        throw sources.error(
          head,
          "a partial has no frontmatter: the documents that include it set version and effectiveDate",
        );
      }
      expand(body, [...stack, name]);
      parent.children.splice(index, 1, ...body.children);
      index += body.children.length - 1;
    }
  };

  expand(tree, []);
  return records;
}
