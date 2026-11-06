import { DocSection } from "@/components/docs/doc-components";
import { ContactAddress } from "@/components/shared/contact-address";
import { ProseP } from "@skillsite/ui/typography/prose";
import { TextLink } from "@skillsite/ui/primitives/link";
import { legalContact } from "@/content/legal";

/** /impressum around its prose: metadata and hero. */
export const impressumPage = {
  metadata: {
    title: "Impressum",
    description:
      "Anbieterkennzeichnung und rechtliche Angaben zu Nachhilfe Leon Weimann.",
  },
  hero: {
    badge: "Anbieterkennzeichnung",
    title: "Impressum",
    lead: "Rechtliche Angaben und Kontaktinformationen zu Nachhilfe Leon Weimann.",
  },
};

/** The Impressum's sections, in order, as /impressum renders them. */
export function ImpressumProse() {
  return (
    <>
      <DocSection id="anbieter" title="Angaben gemäß § 5 DDG">
        <ContactAddress />
      </DocSection>

      <DocSection id="kontakt" title="Kontaktdaten">
        <ProseP>
          E-Mail:{" "}
          <TextLink variant="doc" href={`mailto:${legalContact.email}`}>
            {legalContact.email}
          </TextLink>
          <br />
          Telefonnummer:{" "}
          <TextLink variant="doc" href={`tel:${legalContact.phone}`}>
            {legalContact.phone}
          </TextLink>
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
    </>
  );
}
