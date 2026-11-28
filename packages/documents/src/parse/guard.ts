/**
 * The directive guard (spec `docs/specs/documents.md`, E-18) and the checks
 * that catch directive syntax remark reads differently than the author meant.
 * It runs on each file's syntax tree before anything is resolved.
 */
import type { Root } from "mdast";
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective,
} from "mdast-util-directive";
import { SKIP, visit } from "unist-util-visit";

import { directiveNames, formColons, type DirectiveForm } from "./markdown.ts";
import { DocumentError, type SourceFile } from "./sources.ts";

export type Directive = ContainerDirective | LeafDirective | TextDirective;

const formOfType = {
  textDirective: "text",
  leafDirective: "leaf",
  containerDirective: "container",
} as const satisfies Record<Directive["type"], DirectiveForm>;

const isKnown = (form: DirectiveForm, name: string) =>
  (directiveNames[form] as readonly string[]).includes(name);

/** How the source writes a directive: `:name`, `::name` or `:::name`. */
export function showDirective(node: Directive): string {
  return `${formColons[formOfType[node.type]]}${node.name}`;
}

/**
 * Checks one file's tree and restores the colons that are prose:
 *
 * - A text directive with an unknown name and neither `[]` nor `{}` is prose
 *   such as `16:00`, `1:2:3` or `Hinweis:Text`: it turns back into its text.
 * - Every other unknown directive, and a known name in the wrong form, fails.
 * - A container must end with its own closing fence.
 * - Attribute values are quoted.
 * - A `::` left in the text is a directive remark could not read: a leaf
 *   directive that is not alone on its line, or a container fence closed by
 *   one with as many colons nested inside it.
 */
export function guardDirectives(tree: Root, file: SourceFile): void {
  const fail = (line: number, reason: string): never => {
    throw new DocumentError({ file: file.file, line }, reason);
  };
  const lineOf = (node: { position?: { start: { line: number } } }) =>
    node.position?.start.line ?? 1;
  const textOf = (node: Directive) => {
    const { start, end } = node.position ?? {};
    return start?.offset === undefined || end?.offset === undefined
      ? ""
      : file.source.slice(start.offset, end.offset);
  };

  visit(tree, (node, index, parent) => {
    if (node.type === "text") {
      const at = node.value.indexOf("::");
      if (at !== -1) {
        const lineOffset = node.value.slice(0, at).split("\n").length - 1;
        fail(
          lineOf(node) + lineOffset,
          "stray `::`: a leaf directive stands alone on its line, and a container fence needs more colons than every container fence nested inside it",
        );
      }
      return;
    }
    if (
      node.type !== "textDirective" &&
      node.type !== "leafDirective" &&
      node.type !== "containerDirective"
    ) {
      return;
    }

    const form = formOfType[node.type];
    if (!isKnown(form, node.name)) {
      const bare = textOf(node).length === node.name.length + 1;
      if (form === "text" && bare && parent && index !== undefined) {
        parent.children.splice(index, 1, {
          type: "text",
          value: `:${node.name}`,
          position: node.position,
        });
        return [SKIP, index];
      }
      const other = (Object.keys(directiveNames) as DirectiveForm[]).find(
        (candidate) => isKnown(candidate, node.name),
      );
      return fail(
        lineOf(node),
        other
          ? `${showDirective(node)} is written ${formColons[other]}${node.name}`
          : `unknown directive ${showDirective(node)}`,
      );
    }

    const source = textOf(node);
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      const opening =
        node.type === "containerDirective" ? source.split("\n")[0]! : source;
      const attributes = /\{([^{}]*)\}[ \t]*$/.exec(opening)?.[1] ?? "";
      const unquoted = attributes.replace(/"[^"]*"|'[^']*'/g, '""');
      if (/=[ \t]*(?!["'])/.test(unquoted)) {
        fail(
          lineOf(node),
          `quote the attribute values of ${showDirective(node)}: key="value"`,
        );
      }
    }

    if (node.type === "containerDirective") {
      const colons = /^[ \t]*(:+)/.exec(source)?.[1]?.length ?? 3;
      const lines = source.split(/\r?\n/);
      const last = lines.at(-1)!.trim();
      if (lines.length < 2 || !new RegExp(`^:{${colons},}$`).test(last)) {
        fail(
          lineOf(node),
          `${showDirective(node)} is never closed: close it with a line of ${colons} colons, and give every container fence more colons than the ones nested inside it`,
        );
      }
    }
    return undefined;
  });
}
