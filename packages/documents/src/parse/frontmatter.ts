import type { Root } from "mdast";
import {
  isAlias,
  isMap,
  isNode,
  isScalar,
  LineCounter,
  parseDocument,
  visit,
  type Node as YamlNode,
} from "yaml";

import { frontmatterSchema, type Frontmatter } from "../schema/index.ts";
import { DocumentError, type SourceFile } from "./sources.ts";

const dateLabel = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** An ISO date as the texts print it: `2026-07-14` is "Juli 2026" (spec "Frontmatter"). */
export function effectiveDateLabel(isoDate: string): string {
  return dateLabel.format(new Date(`${isoDate}T00:00:00Z`));
}

/**
 * The validated frontmatter of a document. YAML 1.2 (the `yaml` package)
 * keeps `2026-07-14` a string. An error names the line of the field at fault,
 * or the opening `---` for a missing field.
 */
export function readFrontmatter(tree: Root, file: SourceFile): Frontmatter {
  const [first] = tree.children;
  if (first?.type !== "yaml") {
    throw new DocumentError(
      { file: file.file, line: 1 },
      "a document starts with its frontmatter, between two `---` lines",
    );
  }

  const lineCounter = new LineCounter();
  const yaml = parseDocument(first.value, { lineCounter, uniqueKeys: true });
  const fail = (node: YamlNode | undefined, reason: string): never => {
    const opening = first.position?.start.line ?? 1;
    // The YAML text starts on the line after the opening `---`.
    const line = node?.range
      ? opening + lineCounter.linePos(node.range[0]).line
      : opening;
    throw new DocumentError({ file: file.file, line }, reason);
  };

  const [yamlError] = yaml.errors;
  if (yamlError) {
    const line =
      (first.position?.start.line ?? 1) +
      lineCounter.linePos(yamlError.pos[0]).line;
    throw new DocumentError(
      { file: file.file, line },
      // The prefix names the place; yaml's own "at line …, column …" would count from the YAML text.
      `frontmatter: ${yamlError.message.split("\n")[0]!.replace(/ at line \d+, column \d+:?$/, "")}`,
    );
  }
  if (!isMap(yaml.contents)) {
    return fail(undefined, "the frontmatter is a list of `field: value` lines");
  }

  // Frontmatter has no use for anchors and aliases, and an unresolved alias would throw in `toJS()`.
  let reused: YamlNode | undefined;
  visit(yaml, (_, node) => {
    if (isAlias(node) || (isNode(node) && node.anchor)) {
      reused = node;
      return visit.BREAK;
    }
    return undefined;
  });
  if (reused) {
    return fail(
      reused,
      "frontmatter: anchors and aliases (`&name`, `*name`) are not allowed",
    );
  }

  let data: unknown;
  try {
    data = yaml.toJS();
  } catch (error) {
    return fail(undefined, `frontmatter: ${(error as Error).message}`);
  }
  const result = frontmatterSchema.safeParse(data);
  if (result.success) return result.data;

  const [issue] = result.error.issues;
  if (!issue) return fail(undefined, "the frontmatter is invalid");
  if (issue.code === "unrecognized_keys") {
    // The key sits in the map at the issue's path: the top level, or one such as `sections`.
    const [key] = issue.keys;
    const path = issue.path.map(String);
    const map = path.length ? yaml.getIn(path, true) : yaml.contents;
    const pair = isMap(map)
      ? map.items.find((item) => isScalar(item.key) && item.key.value === key)
      : undefined;
    return fail(
      (pair?.key as YamlNode | undefined) ?? (map as YamlNode | undefined),
      `unknown frontmatter field "${[...path, key].join(".")}"`,
    );
  }

  const path = issue.path.map(String);
  const field = `frontmatter field "${path.join(".")}"`;
  const node = yaml.getIn(path, true) as YamlNode | undefined;
  if (node) return fail(node, `${field}: ${issue.message}`);
  // Missing: point at the map it belongs in, or at the opening `---`.
  const parent =
    path.length > 1
      ? (yaml.getIn(path.slice(0, -1), true) as YamlNode | undefined)
      : undefined;
  return fail(
    parent,
    issue.code === "custom"
      ? `${field}: ${issue.message}`
      : `${field} is missing`,
  );
}
