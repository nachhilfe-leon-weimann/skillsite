/**
 * The frontmatter of a document and the JSON tree the build writes for it
 * (spec `docs/specs/documents.md`, "Frontmatter").
 */
import { z } from "zod";

import { bodyBlock, lineText, sectionId, type BodyBlock } from "./nodes.ts";

export const targets = ["web", "pdf"] as const;
export type Target = (typeof targets)[number];

/** The fields a `web` target needs for its page (open question 4). */
export const webFields = [
  "shortTitle",
  "badge",
  "lead",
  "description",
] as const;

const frontmatterFields = {
  /** The h1 and the PDF title; it may hold U+00AD. */
  title: lineText,
  /** The `<title>` segment ("AGB"). */
  shortTitle: lineText.optional(),
  /** The hero pill, and the PDF's eyebrow. */
  badge: lineText.optional(),
  /** The hero lead, and the PDF's subtitle. */
  lead: lineText.optional(),
  /** The meta description. */
  description: lineText.optional(),
  /** The identifier the booking records (E-15). */
  version: lineText,
  /** An ISO date, `YYYY-MM-DD`. */
  effectiveDate: z.iso.date({
    error: "effectiveDate is an ISO date, YYYY-MM-DD",
  }),
  targets: z
    .array(z.enum(targets))
    .min(1, "targets names web, pdf or both")
    .refine(
      (list) => new Set(list).size === list.length,
      "a target is listed twice",
    ),
  /** `numbered`: sections carry numbers; `nav`: the page lists them. */
  sections: z.strictObject({ numbered: z.boolean(), nav: z.boolean() }),
};

/** A `web` target needs every field of `webFields`. */
function requireWebFields(
  value: { targets: readonly Target[] } & Partial<
    Record<(typeof webFields)[number], string>
  >,
  ctx: z.RefinementCtx,
) {
  if (!value.targets.includes("web")) return;
  for (const field of webFields) {
    if (value[field] === undefined) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required for a web target`,
      });
    }
  }
}

export const frontmatterSchema = z
  .strictObject(frontmatterFields)
  .superRefine(requireWebFields);

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** The frontmatter plus what the parser derives from it. */
export const documentMetaSchema = z
  .strictObject({
    ...frontmatterFields,
    /** `effectiveDate` as the texts print it: "Juli 2026". */
    effectiveDateLabel: lineText,
  })
  .superRefine(requireWebFields);

export type DocumentMeta = z.infer<typeof documentMetaSchema>;

/** The labels a renderer prints around the text (E-14); the ones inside it are in the nodes. */
export const documentLabelsSchema = z.strictObject({
  effectiveDate: lineText,
  contact: lineText,
  page: lineText,
});

export type DocumentLabels = z.infer<typeof documentLabelsSchema>;

export const navEntrySchema = z.strictObject({
  id: sectionId,
  label: lineText,
});

export type NavEntry = z.infer<typeof navEntrySchema>;

export const documentSlug = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "a document's file name is lowercase letters and digits, joined by single hyphens",
  );

/** The sections of a body, in order. */
const sectionsOf = (body: readonly BodyBlock[]) =>
  body.flatMap((block) => (block.type === "section" ? [block] : []));

/** Every anchor link's target id, anywhere in a body. */
function anchorTargets(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(anchorTargets);
  if (value === null || typeof value !== "object") return [];
  const node = value as Record<string, unknown>;
  const own =
    node.type === "link" &&
    node.kind === "anchor" &&
    typeof node.href === "string"
      ? [node.href.slice(1)]
      : [];
  return [...own, ...Object.values(node).flatMap(anchorTargets)];
}

/** One document's JSON tree. */
export const documentTreeSchema = z
  .strictObject({
    slug: documentSlug,
    meta: documentMetaSchema,
    labels: documentLabelsSchema,
    /** The page navigation; empty when `meta.sections.nav` is false. */
    nav: z.array(navEntrySchema),
    body: z.array(bodyBlock),
  })
  .superRefine((tree, ctx) => {
    const sections = sectionsOf(tree.body);
    const ids = sections.map((section) => section.id);
    const issue = (path: PropertyKey[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    ids.forEach((id, index) => {
      if (ids.indexOf(id) !== index)
        issue(["body"], `two sections have the id "${id}"`);
    });

    const firstSection = tree.body.findIndex(
      (block) => block.type === "section",
    );
    tree.body.forEach((block, index) => {
      if (
        firstSection !== -1 &&
        index > firstSection &&
        block.type !== "section"
      ) {
        issue(
          ["body", index],
          "a block after the first section belongs to a section",
        );
      }
    });

    sections.forEach((section) => {
      const index = tree.body.indexOf(section);
      const number = tree.meta.sections.numbered
        ? sections.indexOf(section) + 1
        : null;
      if (section.number !== number) {
        issue(["body", index, "number"], `the section's number is ${number}`);
      }
      const heading =
        number === null ? section.title : `${number}. ${section.title}`;
      if (section.heading !== heading) {
        issue(
          ["body", index, "heading"],
          `the section's heading is "${heading}"`,
        );
      }
    });

    const nav = tree.meta.sections.nav
      ? sections.map((section) => ({ id: section.id, label: section.navLabel }))
      : [];
    if (JSON.stringify(tree.nav) !== JSON.stringify(nav)) {
      issue(
        ["nav"],
        "the navigation lists every section with its navLabel, or nothing",
      );
    }

    for (const target of anchorTargets(tree.body)) {
      if (!ids.includes(target))
        issue(["body"], `a link points to the missing section "${target}"`);
    }
  });

export type DocumentTree = z.infer<typeof documentTreeSchema>;

/** `dist/documents.json`: every document, keyed by slug. */
export const documentsFileSchema = z.record(documentSlug, documentTreeSchema);
