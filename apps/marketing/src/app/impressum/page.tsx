import { FileText } from "lucide-react";

import { getDocument, webMeta } from "@skillsite/documents";
import { DocHero, DocShell } from "@/components/docs/doc-components";
import { DocumentBody } from "@/components/docs/document";
import { pageMetadata } from "@/lib/metadata";

/**
 * The Impressum from `packages/documents/content/impressum.md`. Whether its
 * sections are numbered or listed is its frontmatter's call; its hero shows no
 * facts: no date.
 */
const impressum = getDocument("impressum");
const meta = webMeta(impressum.meta);

export const metadata = pageMetadata({
  title: meta.shortTitle,
  description: meta.description,
  canonical: "/impressum",
});

export default function ImpressumPage() {
  return (
    <DocShell
      sections={impressum.nav}
      hero={
        <DocHero
          badge={meta.badge}
          icon={FileText}
          title={meta.title}
          lead={meta.lead}
        />
      }
    >
      <DocumentBody body={impressum.body} />
    </DocShell>
  );
}
