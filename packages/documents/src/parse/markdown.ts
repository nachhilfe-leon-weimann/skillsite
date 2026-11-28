import type { Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

/** The Markdown dialect of the documents (E-03): GFM, YAML frontmatter and directives. */
const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm)
  .use(remarkDirective);

/** The Markdown syntax tree of a source text. */
export function parseMarkdown(source: string): Root {
  return processor.parse(source);
}

/** The directives a document may use, by form (spec "Node types and their source"). */
export const directiveNames = {
  container: [
    "subsection",
    "group",
    "legal-basis",
    "link-list",
    "detail-grid",
    "detail-list",
    "entry",
    "panel",
    "form",
  ],
  leaf: [
    "provider-link",
    "contact-address",
    "form-line",
    "field",
    "signature",
    "form-note",
    "include",
  ],
  text: ["anchor", "value", "mailto", "tel", "ref"],
} as const;

export type DirectiveForm = keyof typeof directiveNames;

/** The colons that open a directive of each form. */
export const formColons: Record<DirectiveForm, string> = {
  text: ":",
  leaf: "::",
  container: ":::",
};
