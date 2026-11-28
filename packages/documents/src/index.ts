import "server-only";

import documents from "../dist/documents.json" with { type: "json" };
import type { DocumentSlug } from "./meta.ts";
import { documentsFileSchema, type DocumentTree } from "./schema/index.ts";

let trees: Readonly<Record<string, DocumentTree>> | undefined;

/**
 * A document's tree from the build output (`dist/documents.json`), validated
 * against the registry on the first call.
 */
export function getDocument(slug: DocumentSlug): DocumentTree {
  trees ??= documentsFileSchema.parse(documents);
  const tree = trees[slug];
  if (!tree) {
    throw new Error(
      `no document "${String(slug)}" in dist/documents.json; run the documents build`,
    );
  }
  return tree;
}

export type { DocumentSlug, DocumentVersion } from "./meta.ts";
export { nodeTypes } from "./schema/index.ts";
export type {
  BodyBlock,
  Break,
  ContactAddress,
  DetailGrid,
  DetailList,
  DocumentLabels,
  DocumentMeta,
  DocumentTree,
  Entry,
  Field,
  FlowBlock,
  Form,
  FormItem,
  FormLine,
  FormNote,
  Group,
  Inline,
  LegalBasis,
  Link,
  LinkKind,
  LinkList,
  List,
  NavEntry,
  NodeOf,
  NodeType,
  Panel,
  Paragraph,
  ProviderLink,
  Section,
  Signature,
  Subsection,
  Target,
  Text,
} from "./schema/index.ts";
