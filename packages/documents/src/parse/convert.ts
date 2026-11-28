/**
 * Markdown syntax tree -> document tree: resolves sections, numbers,
 * placeholders, section references and labels, and rejects every construct
 * the registry does not declare (spec "Node types and their source").
 */
import type {
  BlockContent,
  DefinitionContent,
  Heading,
  Link as MarkdownLink,
  List as MarkdownList,
  ListItem,
  Nodes,
  Paragraph as MarkdownParagraph,
  PhrasingContent,
  Root,
  RootContent,
} from "mdast";
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective,
} from "mdast-util-directive";

import { labels } from "../labels.ts";
import { provider } from "../provider.ts";
import type {
  BodyBlock,
  DetailList,
  FlowBlock,
  FormItem,
  Inline,
  Link,
  LinkKind,
  NavEntry,
  Section,
} from "../schema/index.ts";
import { showDirective, type Directive } from "./guard.ts";
import type { Location, Sources } from "./sources.ts";

export interface ConvertOptions {
  sources: Sources;
  /** The placeholder keys and their text. */
  values: ReadonlyMap<string, string>;
  /** `sections.numbered` of the frontmatter. */
  numbered: boolean;
  /** `sections.nav` of the frontmatter. */
  nav: boolean;
  /** Receives the source place of every node written, for schema errors. */
  locations: WeakMap<object, Location>;
}

export interface ConvertedBody {
  body: BodyBlock[];
  nav: NavEntry[];
}

/** A section heading, read before the body so a reference can point forward. */
interface SectionHead {
  id: string;
  number: number | null;
  title: string;
  navLabel: string;
  at: Location;
}

/** A soft line ending with the spaces around it: one space in the text. */
const SOFT_LINE_ENDING = /[ \t]*\r?\n[ \t]*/g;

const FORM_LINES = ["form-line", "field", "signature", "form-note"];

/** What the error says about a Markdown construct the documents do not use. */
const UNUSED: Partial<Record<Nodes["type"], string>> = {
  blockquote: "a quote (>)",
  code: "a code block",
  definition: "a link definition",
  delete: "struck-through text",
  emphasis: "italic text",
  footnoteDefinition: "a footnote",
  footnoteReference: "a footnote",
  html: "HTML",
  image: "an image",
  imageReference: "an image",
  inlineCode: "inline code",
  linkReference: "a reference link",
  table: "a table",
  thematicBreak: "a horizontal rule",
  yaml: "frontmatter after the start of the file",
};

export function convertBody(
  root: Root,
  options: ConvertOptions,
): ConvertedBody {
  return new Converter(options).body(root);
}

class Converter {
  private readonly sources: Sources;
  private readonly values: ReadonlyMap<string, string>;
  private readonly numbered: boolean;
  private readonly withNav: boolean;
  private readonly locations: WeakMap<object, Location>;
  private readonly sectionNumbers = new Map<string, number | null>();

  constructor(options: ConvertOptions) {
    this.sources = options.sources;
    this.values = options.values;
    this.numbered = options.numbered;
    this.withNav = options.nav;
    this.locations = options.locations;
  }

  body(root: Root): ConvertedBody {
    const content = root.children.filter((node) => node.type !== "yaml");

    const heads = new Map<Heading, SectionHead>();
    for (const node of content) {
      if (node.type !== "heading") continue;
      const head = this.sectionHead(node, heads.size + 1);
      const first = [...heads.values()].find((other) => other.id === head.id);
      if (first) {
        this.fail(
          node,
          `two sections have the id "${head.id}"; the first is at ${first.at.file}:${first.at.line}`,
        );
      }
      heads.set(node, head);
      this.sectionNumbers.set(head.id, head.number);
    }

    const body: BodyBlock[] = [];
    let section: Section | undefined;
    for (const node of content) {
      if (node.type === "heading") {
        const head = heads.get(node)!;
        section = this.at<Section>(node, {
          type: "section",
          id: head.id,
          number: head.number,
          title: head.title,
          heading:
            head.number === null ? head.title : `${head.number}. ${head.title}`,
          navLabel: head.navLabel,
          children: [],
        });
        body.push(section);
      } else {
        (section ? section.children : body).push(this.flowBlock(node));
      }
    }

    const nav = this.withNav
      ? [...heads].map(([node, head]) =>
          this.at(node, { id: head.id, label: head.navLabel }),
        )
      : [];
    return { body, nav };
  }

  // --- Sections ---

  /** `## Title :anchor{#id nav="Label"}` at the top level. */
  private sectionHead(node: Heading, position: number): SectionHead {
    if (node.depth !== 2) {
      this.fail(
        node,
        node.depth === 1
          ? "the document title comes from the frontmatter; a section heading is ## Title :anchor{#id}"
          : "a heading below ## is a subsection: ::::subsection[Title]",
      );
    }
    const anchor = node.children.at(-1);
    if (anchor?.type !== "textDirective" || anchor.name !== "anchor") {
      return this.fail(
        node,
        'a section heading ends with its anchor: ## Title :anchor{#id nav="Label"}',
      );
    }
    if (anchor.children.length > 0) {
      this.fail(anchor, ':anchor takes no label: :anchor{#id nav="Label"}');
    }
    const { id = "", nav } = this.attributes(anchor, { id: true, nav: false });
    const title = this.plain(
      node.children.slice(0, -1),
      node,
      "a section heading",
    ).replace(/ +$/, "");
    return {
      id,
      number: this.numbered ? position : null,
      title,
      navLabel: nav ?? title,
      at: this.sources.locate(node),
    };
  }

  // --- Blocks ---

  private flow(nodes: ReadonlyArray<RootContent>): FlowBlock[] {
    return nodes.map((node) => this.flowBlock(node));
  }

  private flowBlock(
    node: RootContent | BlockContent | DefinitionContent,
  ): FlowBlock {
    switch (node.type) {
      case "paragraph":
        return this.paragraph(node);
      case "list":
        return this.at(node, { type: "list", items: this.items(node) });
      case "containerDirective":
        return this.container(node);
      case "leafDirective":
        return this.leaf(node);
      case "heading":
        return this.fail(
          node,
          node.depth === 2
            ? "a section heading (##) stands at the top level, outside every directive"
            : "a heading below ## is a subsection: ::::subsection[Title]",
        );
      default:
        return this.fail(
          node,
          `${UNUSED[node.type] ?? `Markdown "${node.type}"`} is not used in a document`,
        );
    }
  }

  /** A paragraph; one entirely in `**…**` has weight `medium`. */
  private paragraph(node: MarkdownParagraph): FlowBlock {
    const [only, ...rest] = node.children;
    if (only?.type === "strong" && rest.length === 0) {
      return this.at(node, {
        type: "paragraph",
        weight: "medium",
        children: this.inlines(only.children),
      });
    }
    return this.at(node, {
      type: "paragraph",
      weight: "regular",
      children: this.inlines(node.children),
    });
  }

  /** The items of a bullet list, each one paragraph of inline content. */
  private items(node: MarkdownList): Inline[][] {
    if (node.ordered) {
      this.fail(
        node,
        "a numbered list is not used in a document; write a bullet list (- item)",
      );
    }
    return node.children.map((item) => {
      if (item.checked !== null && item.checked !== undefined) {
        this.fail(item, "a task list item ([ ]) is not used in a document");
      }
      const [only, ...rest] = item.children;
      if (only?.type !== "paragraph" || rest.length > 0) {
        return this.fail(
          item,
          "a list item is one paragraph of text: no nested list, no second paragraph",
        );
      }
      return this.at(item, this.inlines(only.children));
    });
  }

  private container(node: ContainerDirective): FlowBlock {
    const { label, children } = this.parts(node);
    this.attributes(node, {});
    switch (node.name) {
      case "subsection":
        return this.at(node, {
          type: "subsection",
          title: this.label(node, label),
          children: this.flow(children),
        });
      case "group":
        return this.at(node, {
          type: "group",
          title: this.label(node, label),
          children: this.flow(children),
        });
      case "entry":
        this.noLabel(node, label);
        return this.at(node, { type: "entry", children: this.flow(children) });
      case "panel":
        this.noLabel(node, label);
        return this.at(node, { type: "panel", children: this.flow(children) });
      case "legal-basis": {
        this.noLabel(node, label);
        const [only, ...rest] = children;
        if (only?.type !== "paragraph" || rest.length > 0) {
          return this.fail(node, ":::legal-basis holds one paragraph");
        }
        return this.at(node, {
          type: "legalBasis",
          label: labels.legalBasis,
          children: this.inlines(only.children),
        });
      }
      case "link-list": {
        this.noLabel(node, label);
        const [only, ...rest] = children;
        if (only?.type !== "list" || only.ordered || rest.length > 0) {
          return this.fail(node, ":::link-list holds one bullet list of links");
        }
        return this.at(node, {
          type: "linkList",
          links: only.children.map((item) => this.linkItem(item)),
        });
      }
      case "detail-grid": {
        this.noLabel(node, label);
        const lists = children.map((child) =>
          child.type === "containerDirective" && child.name === "detail-list"
            ? this.detailList(child)
            : this.fail(
                child,
                "a ::::detail-grid holds only :::detail-list[Title] blocks",
              ),
        );
        return this.at(node, { type: "detailGrid", children: lists });
      }
      case "detail-list":
        return this.fail(
          node,
          ":::detail-list stands inside a ::::detail-grid",
        );
      case "form": {
        this.noLabel(node, label);
        const lines = children.map((child) => this.formItem(child));
        const note = lines.findIndex((line) => line.type === "formNote");
        if (note !== -1 && note !== lines.length - 1) {
          this.fail(
            children[note]!,
            "::form-note is the last line of a form, and a form has one at most",
          );
        }
        return this.at(node, { type: "form", children: lines });
      }
      default:
        return this.fail(node, `unknown directive ${showDirective(node)}`);
    }
  }

  private detailList(node: ContainerDirective): DetailList {
    const { label, children } = this.parts(node);
    this.attributes(node, {});
    const title = this.label(node, label);
    const [only, ...rest] = children;
    if (only?.type !== "list" || rest.length > 0) {
      return this.fail(node, ":::detail-list[Title] holds one bullet list");
    }
    return this.at(node, {
      type: "detailList",
      title,
      items: this.items(only),
    });
  }

  private formItem(node: RootContent): FormItem {
    if (node.type !== "leafDirective" || !FORM_LINES.includes(node.name)) {
      return this.fail(
        node,
        "a :::form holds only ::form-line, ::field, ::signature and ::form-note lines",
      );
    }
    this.attributes(node, {});
    const text = this.label(node, node.children);
    switch (node.name) {
      case "form-line":
        return this.at(node, { type: "formLine", text });
      case "field":
        return this.at(node, { type: "field", label: text });
      case "signature":
        return this.at(node, { type: "signature", label: text });
      default:
        return this.at(node, { type: "formNote", text });
    }
  }

  private leaf(node: LeafDirective): FlowBlock {
    switch (node.name) {
      case "provider-link": {
        const { href = "" } = this.attributes(node, { href: true });
        return this.at(node, {
          type: "providerLink",
          href,
          text: this.label(node, node.children),
        });
      }
      case "contact-address":
        this.noLabel(node, node.children);
        this.attributes(node, {});
        return this.at(node, {
          type: "contactAddress",
          lines: [
            provider.businessName,
            provider.ownerName,
            provider.street,
            provider.city,
            provider.country,
          ],
        });
      default:
        return this.fail(
          node,
          FORM_LINES.includes(node.name)
            ? `${showDirective(node)} stands inside a :::form`
            : `${showDirective(node)} is not a block of its own here`,
        );
    }
  }

  // --- Inline content ---

  /** Inline content with adjacent text merged: soft line endings are single spaces. */
  private inlines(nodes: ReadonlyArray<PhrasingContent>): Inline[] {
    const out: Inline[] = [];
    for (const inline of nodes.flatMap((node) => this.inline(node))) {
      const last = out.at(-1);
      if (inline.type === "text" && last?.type === "text")
        last.value += inline.value;
      else out.push(inline);
    }
    return out;
  }

  private inline(node: PhrasingContent): Inline[] {
    switch (node.type) {
      case "text":
        return [
          this.at(node, {
            type: "text",
            value: node.value.replace(SOFT_LINE_ENDING, " "),
          }),
        ];
      case "break":
        if (!this.sources.text(node).startsWith("\\")) {
          this.fail(
            node,
            "a line break is a backslash at the end of the line, not trailing spaces",
          );
        }
        return [this.at(node, { type: "break" })];
      case "link":
        return [this.link(node)];
      case "textDirective":
        return [this.textDirective(node)];
      case "strong":
        return this.fail(node, "bold text covers a whole paragraph: **…**");
      default:
        return this.fail(
          node,
          `${UNUSED[node.type] ?? `Markdown "${node.type}"`} is not used in a document`,
        );
    }
  }

  /** A Markdown link: a route or an https: address. */
  private link(node: MarkdownLink): Link {
    if (node.title) this.fail(node, "a link takes no title");
    const text = this.plain(node.children, node, "a link's text");
    const { url } = node;
    let kind: LinkKind;
    if (url.startsWith("/")) kind = "route";
    else if (url.startsWith("https://")) kind = "external";
    else if (url.startsWith("mailto:"))
      return this.fail(
        node,
        "an e-mail link is :mailto[key], such as :mailto[provider.email]",
      );
    else if (url.startsWith("tel:"))
      return this.fail(
        node,
        "a phone link is :tel[key], such as :tel[provider.phone]",
      );
    else if (url.startsWith("#"))
      return this.fail(node, "a link to a section is :ref[id]");
    else
      return this.fail(
        node,
        "a link goes to a route (/preise) or an https: address",
      );
    return this.at(node, { type: "link", kind, href: url, text });
  }

  private linkItem(item: ListItem): Link {
    const [only, ...rest] = item.children;
    const inlines =
      only?.type === "paragraph" && rest.length === 0
        ? this.inlines(only.children)
        : [];
    const [link, ...others] = inlines;
    if (link?.type !== "link" || others.length > 0) {
      return this.fail(
        item,
        "an item of a :::link-list is exactly one link: - [Discord](https://…)",
      );
    }
    return link;
  }

  /** `:value[key]`, `:mailto[key]`, `:tel[key]` and `:ref[id]`. */
  private textDirective(node: TextDirective): Inline {
    if (node.name === "anchor") {
      return this.fail(
        node,
        ":anchor ends a section heading: ## Title :anchor{#id}",
      );
    }
    this.attributes(node, {});
    const [only, ...rest] = node.children;
    if (only?.type !== "text" || rest.length > 0) {
      return this.fail(
        node,
        `${showDirective(node)} needs a key: ${showDirective(node)}[${node.name === "ref" ? "section-id" : "provider.email"}]`,
      );
    }
    const key = only.value;

    if (node.name === "ref") {
      if (!this.numbered)
        this.fail(
          node,
          ":ref needs numbered sections (sections.numbered: true)",
        );
      const number = this.sectionNumbers.get(key);
      if (number === undefined || number === null)
        return this.fail(node, `no section has the id "${key}"`);
      return this.at(node, {
        type: "link",
        kind: "anchor",
        href: `#${key}`,
        text: `${labels.sectionRef} ${number}`,
      });
    }

    const value = this.values.get(key);
    if (value === undefined) {
      return this.fail(
        node,
        `unknown placeholder "${key}"; known: ${[...this.values.keys()].join(", ")}`,
      );
    }
    switch (node.name) {
      case "mailto":
        if (!/^[^\s@]+@[^\s@]+$/.test(value))
          this.fail(
            node,
            `:mailto needs an e-mail address, and "${key}" holds none`,
          );
        return this.at(node, {
          type: "link",
          kind: "mailto",
          href: `mailto:${value}`,
          text: value,
        });
      case "tel":
        if (!/^\+?[0-9][0-9 ]*$/.test(value))
          this.fail(node, `:tel needs a phone number, and "${key}" holds none`);
        return this.at(node, {
          type: "link",
          kind: "tel",
          href: `tel:${value}`,
          text: value,
        });
      default:
        return this.at(node, { type: "text", value });
    }
  }

  // --- Labels and attributes ---

  /** A container's label (its first paragraph, as remark-directive writes it) and its body. */
  private parts(node: ContainerDirective) {
    const [first, ...rest] = node.children;
    return first?.type === "paragraph" && first.data?.directiveLabel
      ? { label: first.children, children: rest }
      : { label: undefined, children: node.children };
  }

  /** The required label of a directive, as plain text. */
  private label(
    node: Directive,
    label: ReadonlyArray<PhrasingContent> | undefined,
  ): string {
    if (!label?.length) {
      return this.fail(
        node,
        `${showDirective(node)} needs a label: ${showDirective(node)}[…]`,
      );
    }
    return this.plain(label, node, `the label of ${showDirective(node)}`);
  }

  private noLabel(
    node: Directive,
    label: ReadonlyArray<PhrasingContent> | undefined,
  ): void {
    if (label?.length) this.fail(node, `${showDirective(node)} takes no label`);
  }

  /** Inline content that must be plain text, as one string. */
  private plain(
    nodes: ReadonlyArray<PhrasingContent>,
    owner: Nodes,
    what: string,
  ): string {
    const inlines = this.inlines(nodes);
    if (inlines.some((inline) => inline.type !== "text")) {
      this.fail(owner, `${what} is plain text: no link and no line break`);
    }
    return inlines
      .map((inline) => (inline.type === "text" ? inline.value : ""))
      .join("");
  }

  /** A directive's attributes against what it takes (`true`: required). */
  private attributes(
    node: Directive,
    accepted: Record<string, boolean>,
  ): Record<string, string | undefined> {
    const attributes = node.attributes ?? {};
    const show = (key: string) =>
      key === "id" ? "#id" : key === "class" ? ".class" : key;
    for (const key of Object.keys(attributes)) {
      if (!(key in accepted))
        this.fail(
          node,
          `${showDirective(node)} takes no attribute ${show(key)}`,
        );
    }
    for (const [key, required] of Object.entries(accepted)) {
      if (required && !attributes[key]) {
        this.fail(
          node,
          `${showDirective(node)} needs ${key === "id" ? "an id: {#id}" : `the attribute ${key}="…"`}`,
        );
      }
    }
    return Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        key,
        value ?? undefined,
      ]),
    );
  }

  // --- Places ---

  /** Records where `node` comes from and returns it. */
  private at<T extends object>(source: Nodes, node: T): T {
    this.locations.set(node, this.sources.locate(source));
    return node;
  }

  private fail(node: Nodes, reason: string): never {
    throw this.sources.error(node, reason);
  }
}
