/**
 * `@skillsite/documents/meta`: the version and the dates of every document
 * (E-15), from the build output. Client-safe: plain JSON, no zod, no tree.
 */
import meta from "../dist/meta.json" with { type: "json" };

/** A document's slug: the name of its file in `content/`, without `.md`. */
export type DocumentSlug = keyof typeof meta;

export interface DocumentVersion {
  /** The identifier the booking records. */
  version: string;
  /** An ISO date, `YYYY-MM-DD`. */
  effectiveDate: string;
  /** `effectiveDate` as the texts print it: "Juli 2026". */
  effectiveDateLabel: string;
}

export const documentVersions: Readonly<Record<DocumentSlug, DocumentVersion>> =
  meta;
