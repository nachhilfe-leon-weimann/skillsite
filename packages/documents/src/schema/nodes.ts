/**
 * The node registry (spec `docs/specs/documents.md`, E-04): every node type a
 * document tree may hold is declared here once, as a zod schema. The parser
 * writes only these nodes, `build.ts` validates every tree against them, and
 * each renderer maps every type in `nodeTypes`. The set covers today's legal
 * texts and nothing more.
 */
import { z } from "zod";

/** One line of text: never empty, never a line end (only a `break` ends a line). */
export const lineText = z
  .string()
  .min(1, "text is empty")
  .regex(/^[^\r\n]*$/, "text holds a line end");

/** A section id, the target of an anchor link. */
export const sectionId = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "a section id is lowercase letters and digits, joined by single hyphens",
  );

/** A web address the document links to. */
const httpsUrl = z.url({
  protocol: /^https$/,
  hostname: z.regexes.domain,
  error: "an external link is an https: address",
});

// --- Inline nodes ---

export const textNode = z.strictObject({
  type: z.literal("text"),
  value: lineText,
});

/** A line break: a backslash at the end of a source line. */
export const breakNode = z.strictObject({
  type: z.literal("break"),
});

/** A link; the parser sets its `kind` from the source. */
export const linkNode = z.discriminatedUnion("kind", [
  /** `[Preisübersicht](/preise)`; the PDF makes it absolute from the site domain. */
  z.strictObject({
    type: z.literal("link"),
    kind: z.literal("route"),
    href: z
      .string()
      .regex(
        /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/,
        "a route is a site path such as /preise",
      ),
    text: lineText,
  }),
  /** `:ref[id]`: the link "Abschnitt N" to `#id`. */
  z.strictObject({
    type: z.literal("link"),
    kind: z.literal("anchor"),
    href: z.string().regex(/^#[a-z0-9]+(?:-[a-z0-9]+)*$/, "an anchor is #id"),
    text: lineText,
  }),
  /** `:mailto[key]`. */
  z.strictObject({
    type: z.literal("link"),
    kind: z.literal("mailto"),
    href: z
      .string()
      .regex(
        /^mailto:[^\s@]+@[^\s@]+\.[a-z]+$/,
        "a mailto: link is mailto:<address>",
      ),
    text: lineText,
  }),
  /** `:tel[key]`; the number is written as the provider data has it. */
  z.strictObject({
    type: z.literal("link"),
    kind: z.literal("tel"),
    href: z
      .string()
      .regex(/^tel:\+?[0-9][0-9 ]*[0-9]$/, "a tel: link is tel:<number>"),
    text: lineText,
  }),
  /** A Markdown `https:` link. */
  z.strictObject({
    type: z.literal("link"),
    kind: z.literal("external"),
    href: httpsUrl,
    text: lineText,
  }),
]);

export const inlineNode = z.discriminatedUnion("type", [
  textNode,
  breakNode,
  linkNode,
]);

/** The inline content of a block: at least one node. */
const inlines = z.array(inlineNode).min(1, "the block holds no text");

// --- Blocks without children ---

/** A paragraph; one written entirely in `**…**` has weight `medium`. */
export const paragraphNode = z.strictObject({
  type: z.literal("paragraph"),
  weight: z.enum(["regular", "medium"]),
  children: inlines,
});

/** A bullet list; each item is one line of inline content. */
export const listNode = z.strictObject({
  type: z.literal("list"),
  items: z.array(inlines).min(1),
});

/** `:::legal-basis`: the label comes from `labels.legalBasis`. */
export const legalBasisNode = z.strictObject({
  type: z.literal("legalBasis"),
  label: lineText,
  children: inlines,
});

/** `::provider-link[Text]{href="https://…"}`. */
export const providerLinkNode = z.strictObject({
  type: z.literal("providerLink"),
  href: httpsUrl,
  text: lineText,
});

/** `:::link-list` around a bullet list of exactly one link per item. */
export const linkListNode = z.strictObject({
  type: z.literal("linkList"),
  links: z.array(linkNode).min(1),
});

/** `:::detail-list[Title]` around a bullet list. */
export const detailListNode = z.strictObject({
  type: z.literal("detailList"),
  title: lineText,
  items: z.array(inlines).min(1),
});

/** `::::detail-grid` around detail lists. */
export const detailGridNode = z.strictObject({
  type: z.literal("detailGrid"),
  children: z.array(detailListNode).min(1),
});

/** `::contact-address`: the provider's postal address, one line each. */
export const contactAddressNode = z.strictObject({
  type: z.literal("contactAddress"),
  lines: z.array(lineText).min(1),
});

// --- The form and its lines ---

/** `::form-line[Text]`: a line with nothing to fill in. */
export const formLineNode = z.strictObject({
  type: z.literal("formLine"),
  text: lineText,
});

/** `::field[Label]`: a line to fill in. */
export const fieldNode = z.strictObject({
  type: z.literal("field"),
  label: lineText,
});

/** `::signature[Label]`: the signature line. */
export const signatureNode = z.strictObject({
  type: z.literal("signature"),
  label: lineText,
});

/** `::form-note[Text]`: the form's footnote. */
export const formNoteNode = z.strictObject({
  type: z.literal("formNote"),
  text: lineText,
});

export const formItemNode = z.discriminatedUnion("type", [
  formLineNode,
  fieldNode,
  signatureNode,
  formNoteNode,
]);

/** `:::form`: its lines in source order, the note (at most one) last. */
export const formNode = z
  .strictObject({
    type: z.literal("form"),
    children: z.array(formItemNode).min(1),
  })
  .refine(
    ({ children }) =>
      children.every(
        (item, index) =>
          item.type !== "formNote" || index === children.length - 1,
      ),
    { message: "a form has at most one note, and it comes last" },
  );

// --- Blocks with block children ---

// The getters make the containers recursive (zod's way); their return types
// are spelled out so TypeScript can infer the cycle.

/** `::::subsection[Title]` … `::::`. */
export const subsectionNode = z.strictObject({
  type: z.literal("subsection"),
  title: lineText,
  get children(): z.ZodArray<typeof flowBlock> {
    return z.array(flowBlock).min(1);
  },
});

/** `:::::group[Title]` … `:::::`. */
export const groupNode = z.strictObject({
  type: z.literal("group"),
  title: lineText,
  get children(): z.ZodArray<typeof flowBlock> {
    return z.array(flowBlock).min(1);
  },
});

/** `:::entry` … `:::`: one entry of a list of blocks, such as a hosting provider. */
export const entryNode = z.strictObject({
  type: z.literal("entry"),
  get children(): z.ZodArray<typeof flowBlock> {
    return z.array(flowBlock).min(1);
  },
});

/** `:::::panel` … `:::::`: a box in the PDF, no wrapper on the web. */
export const panelNode = z.strictObject({
  type: z.literal("panel"),
  get children(): z.ZodArray<typeof flowBlock> {
    return z.array(flowBlock).min(1);
  },
});

/** Every block that may stand inside a section or a container. */
export const flowBlock = z.discriminatedUnion("type", [
  paragraphNode,
  listNode,
  legalBasisNode,
  providerLinkNode,
  linkListNode,
  detailGridNode,
  contactAddressNode,
  formNode,
  subsectionNode,
  groupNode,
  entryNode,
  panelNode,
]);

/**
 * `## Title :anchor{#id nav="Label"}`, with the blocks up to the next section.
 * `heading` is the display heading: "5. Preise und Zahlung", or the bare
 * title in an unnumbered document.
 */
export const sectionNode = z.strictObject({
  type: z.literal("section"),
  id: sectionId,
  number: z.number().int().positive().nullable(),
  title: lineText,
  heading: lineText,
  navLabel: lineText,
  children: z.array(flowBlock).min(1, "the section holds no text"),
});

/** A block of a document's body: a section, or a block before the first section. */
export const bodyBlock = z.discriminatedUnion("type", [sectionNode, flowBlock]);

/** The registry: every node type and its schema. */
export const nodeSchemas = {
  section: sectionNode,
  subsection: subsectionNode,
  group: groupNode,
  paragraph: paragraphNode,
  list: listNode,
  legalBasis: legalBasisNode,
  providerLink: providerLinkNode,
  linkList: linkListNode,
  detailGrid: detailGridNode,
  detailList: detailListNode,
  entry: entryNode,
  contactAddress: contactAddressNode,
  panel: panelNode,
  form: formNode,
  formLine: formLineNode,
  field: fieldNode,
  signature: signatureNode,
  formNote: formNoteNode,
  text: textNode,
  break: breakNode,
  link: linkNode,
} as const;

export type NodeType = keyof typeof nodeSchemas;

/** Every registered node type, blocks first, then the inline types. */
export const nodeTypes = Object.keys(nodeSchemas) as NodeType[];

/** The node of a registered type. */
export type NodeOf<T extends NodeType> = z.infer<(typeof nodeSchemas)[T]>;

export type Section = NodeOf<"section">;
export type Subsection = NodeOf<"subsection">;
export type Group = NodeOf<"group">;
export type Paragraph = NodeOf<"paragraph">;
export type List = NodeOf<"list">;
export type LegalBasis = NodeOf<"legalBasis">;
export type ProviderLink = NodeOf<"providerLink">;
export type LinkList = NodeOf<"linkList">;
export type DetailGrid = NodeOf<"detailGrid">;
export type DetailList = NodeOf<"detailList">;
export type Entry = NodeOf<"entry">;
export type ContactAddress = NodeOf<"contactAddress">;
export type Panel = NodeOf<"panel">;
export type Form = NodeOf<"form">;
export type FormLine = NodeOf<"formLine">;
export type Field = NodeOf<"field">;
export type Signature = NodeOf<"signature">;
export type FormNote = NodeOf<"formNote">;
export type Text = NodeOf<"text">;
export type Break = NodeOf<"break">;
export type Link = NodeOf<"link">;
export type LinkKind = Link["kind"];

export type Inline = z.infer<typeof inlineNode>;
export type FormItem = z.infer<typeof formItemNode>;
export type FlowBlock = z.infer<typeof flowBlock>;
export type BodyBlock = z.infer<typeof bodyBlock>;
