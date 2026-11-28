import { CalendarDays, Mail, ShieldCheck } from "lucide-react";

import { getDocument, webMeta } from "@skillsite/documents";
import { TextLink } from "@skillsite/ui/primitives/link";
import { DocHero, DocShell } from "@/components/docs/doc-components";
import { DocumentBody } from "@/components/docs/document";
import { legalContact } from "@/content/legal-contact";
import { pageMetadata } from "@/lib/metadata";

/** The privacy policy from `packages/documents/content/datenschutz.md`. */
const privacy = getDocument("datenschutz");
const meta = webMeta(privacy.meta);

export const metadata = pageMetadata({
  title: meta.shortTitle,
  description: meta.description,
  canonical: "/datenschutz",
});

export default function DatenschutzPage() {
  return (
    <DocShell
      sections={privacy.nav}
      hero={
        <DocHero
          badge={meta.badge}
          icon={ShieldCheck}
          title={meta.title}
          lead={meta.lead}
          facts={[
            {
              icon: CalendarDays,
              label: privacy.labels.effectiveDate,
              children: meta.effectiveDateLabel,
            },
            {
              icon: Mail,
              label: privacy.labels.contact,
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
      <DocumentBody body={privacy.body} />
    </DocShell>
  );
}
