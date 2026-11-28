/**
 * The web renderer of the document trees (spec `docs/specs/documents.md`,
 * E-04): one renderer per node type of the registry in `@skillsite/documents`,
 * each through today's `Doc*` components with today's classes. The map's type
 * makes a missing renderer a type error, and `document.test.tsx` checks its
 * keys against the registry.
 */
import { Fragment } from "react";

import type { BodyBlock, Inline, NodeOf, NodeType } from "@skillsite/documents";
import { TextLink } from "@skillsite/ui/primitives/link";
import { Address } from "@skillsite/ui/typography/text";
import { ProseP } from "@skillsite/ui/typography/prose";
import { cn } from "@skillsite/ui/utils/cn";

import {
  DocDetailGrid,
  DocDetailList,
  DocEntry,
  DocGroup,
  DocIndentBlock,
  DocLegalBasis,
  DocLinkList,
  DocList,
  DocProviderLink,
  DocSection,
  DocSubSection,
} from "./doc-components";

type AnyNode = NodeOf<NodeType>;

/** Where a node stands among its siblings. */
type Place = { previous?: AnyNode };

type Renderer<T extends NodeType> = (
  node: NodeOf<T>,
  place: Place,
) => React.ReactNode;

export const renderers: { readonly [T in NodeType]: Renderer<T> } = {
  section: (node) => (
    <DocSection id={node.id} title={node.heading}>
      {renderBlocks(node.children)}
    </DocSection>
  ),
  subsection: (node) => (
    <DocSubSection title={node.title}>
      {renderBlocks(node.children)}
    </DocSubSection>
  ),
  group: (node) => (
    <DocGroup title={node.title}>{renderBlocks(node.children)}</DocGroup>
  ),
  // The source carries no spacing: a paragraph right after the contact address gets `mt-6`, as the JSX had it.
  paragraph: (node, { previous }) => (
    <ProseP
      className={cn(
        node.weight === "medium" && "font-medium",
        previous?.type === "contactAddress" && "mt-6",
      )}
    >
      {renderInlines(node.children)}
    </ProseP>
  ),
  list: (node) => <DocList items={node.items.map(renderInlines)} />,
  legalBasis: (node) => (
    <DocLegalBasis label={node.label}>
      {renderInlines(node.children)}
    </DocLegalBasis>
  ),
  providerLink: (node) => (
    <DocProviderLink href={node.href}>{node.text}</DocProviderLink>
  ),
  linkList: (node) => (
    <DocLinkList
      links={node.links.map((link) => ({ label: link.text, href: link.href }))}
    />
  ),
  detailGrid: (node) => (
    <DocDetailGrid>{renderBlocks(node.children)}</DocDetailGrid>
  ),
  detailList: (node) => (
    <DocDetailList title={node.title} items={node.items.map(renderInlines)} />
  ),
  entry: (node) => <DocEntry>{renderBlocks(node.children)}</DocEntry>,
  contactAddress: (node) => (
    <Address>
      {node.lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </Address>
  ),
  // The box is the PDF's; on the web the panel's blocks stand on their own.
  panel: (node) => renderBlocks(node.children),
  form: (node) => {
    const note = node.children.find((item) => item.type === "formNote");
    const lines = node.children.filter((item) => item.type !== "formNote");
    return (
      <DocIndentBlock
        lines={lines.map((line) => renderNode(line))}
        footnote={note ? renderNode(note) : undefined}
      />
    );
  },
  // A form's lines are plain text: the form sets them, one per line.
  formLine: (node) => node.text,
  field: (node) => node.label,
  signature: (node) => node.label,
  formNote: (node) => node.text,
  text: (node) => node.value,
  break: () => <br />,
  link: (node) => (
    <TextLink variant="doc" href={node.href}>
      {node.text}
    </TextLink>
  ),
};

function renderNode(node: AnyNode, place: Place = {}): React.ReactNode {
  // The map pairs every entry with its own node type; TypeScript cannot follow `node.type` into it.
  return (renderers[node.type] as Renderer<NodeType>)(node, place);
}

function renderBlocks(blocks: readonly AnyNode[]): React.ReactNode {
  return blocks.map((block, index) => (
    <Fragment key={index}>
      {renderNode(block, { previous: blocks[index - 1] })}
    </Fragment>
  ));
}

function renderInlines(inlines: readonly Inline[]): React.ReactNode {
  return inlines.map((inline, index) => (
    <Fragment key={index}>{renderNode(inline)}</Fragment>
  ));
}

/** A document's body: its sections, and any block before the first one. */
export function DocumentBody({ body }: { body: readonly BodyBlock[] }) {
  return renderBlocks(body);
}
