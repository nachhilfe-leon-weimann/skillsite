import {
  DocHero,
  DocSection,
  DocShell,
} from "@/components/docs/doc-components";
import { ContactAddress } from "@/components/shared/contact-address";
import { InlineLink, ProseP } from "@skillsite/ui/typography/prose";
import { legalContact } from "@/content/legal";
import { pageMetadata } from "@/lib/metadata";
import { FileText } from "lucide-react";

export const metadata = pageMetadata({
  title: "Impressum",
  description:
    "Anbieterkennzeichnung und rechtliche Angaben zu Nachhilfe Leon Weimann.",
  canonical: "/impressum",
});

export default function ImpressumPage() {
  return (
    <DocShell
      hero={
        <DocHero
          badge="Anbieterkennzeichnung"
          icon={FileText}
          title="Impressum"
          lead="Rechtliche Angaben und Kontaktinformationen zu Nachhilfe Leon Weimann."
        />
      }
    >
      <DocSection id="anbieter" title="Angaben gemäß § 5 DDG">
        <ContactAddress />
      </DocSection>

      <DocSection id="kontakt" title="Kontaktdaten">
        <ProseP>
          E-Mail:{" "}
          <InlineLink variant="doc" href={`mailto:${legalContact.email}`}>
            {legalContact.email}
          </InlineLink>
          <br />
          Telefonnummer:{" "}
          <InlineLink variant="doc" href={`tel:${legalContact.phone}`}>
            {legalContact.phone}
          </InlineLink>
        </ProseP>
      </DocSection>

      <DocSection
        id="streitbeilegung"
        title="Verbraucherstreitbeilegung / Universalschlichtungsstelle"
      >
        <ProseP>
          Ich bin weder bereit noch verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </ProseP>
      </DocSection>
    </DocShell>
  );
}
