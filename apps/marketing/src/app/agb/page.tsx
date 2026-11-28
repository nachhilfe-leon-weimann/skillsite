import { CalendarDays, Mail, ScrollText } from "lucide-react";

import { getDocument, webMeta } from "@skillsite/documents";
import { TextLink } from "@skillsite/ui/primitives/link";
import { DocHero, DocShell } from "@/components/docs/doc-components";
import { DocumentBody } from "@/components/docs/document";
import { legalContact } from "@/content/legal-contact";
import { pageMetadata } from "@/lib/metadata";

/** The AGB from `packages/documents/content/agb.md`. */
const agb = getDocument("agb");
const meta = webMeta(agb.meta);

export const metadata = pageMetadata({
  title: meta.shortTitle,
  description: meta.description,
  canonical: "/agb",
});

export default function AgbPage() {
  return (
    <DocShell
      sections={agb.nav}
      hero={
        <DocHero
          badge={meta.badge}
          icon={ScrollText}
          title={meta.title}
          lead={meta.lead}
          facts={[
            {
              icon: CalendarDays,
              label: agb.labels.effectiveDate,
              children: meta.effectiveDateLabel,
            },
            {
              icon: Mail,
              label: agb.labels.contact,
              children: (
                <TextLink variant="doc" href={`mailto:${legalContact.email}`}>
                  {legalContact.email}
                </TextLink>
              ),
            },
          ]}
        />
      }
    >
      <DocumentBody body={agb.body} />
    </DocShell>
  );
}
