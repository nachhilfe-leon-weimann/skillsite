import { DocHero, DocShell } from "@/components/docs/doc-components";
import { TextLink } from "@skillsite/ui/primitives/link";
import {
  privacyContact,
  privacyPolicyEffectiveDate,
  privacySections,
} from "@/content/privacy";
import { PrivacyProse, privacyPage } from "@/content/legal/datenschutz";
import { pageMetadata } from "@/lib/metadata";
import { CalendarDays, Mail, ShieldCheck } from "lucide-react";

export const metadata = pageMetadata({
  ...privacyPage.metadata,
  canonical: "/datenschutz",
});

export default function DatenschutzPage() {
  const { hero } = privacyPage;
  const effectiveDate = privacyPolicyEffectiveDate.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <DocShell
      sections={privacySections}
      hero={
        <DocHero
          badge={hero.badge}
          icon={ShieldCheck}
          title={hero.title}
          lead={hero.lead}
          facts={[
            {
              icon: CalendarDays,
              label: hero.facts.effectiveDate,
              children: <>{effectiveDate}</>,
            },
            {
              icon: Mail,
              label: hero.facts.contact,
              children: (
                <TextLink variant="doc" href={`mailto:${privacyContact.email}`}>
                  {privacyContact.email}
                </TextLink>
              ),
            },
          ]}
        />
      }
    >
      <PrivacyProse effectiveDate={effectiveDate} />
    </DocShell>
  );
}
