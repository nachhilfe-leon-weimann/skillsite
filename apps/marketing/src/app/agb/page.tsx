import { DocHero, DocShell } from "@/components/docs/doc-components";
import { TextLink } from "@skillsite/ui/primitives/link";
import { agbContact, agbEffectiveDate, agbSections } from "@/content/agb";
import { AgbProse, agbPage } from "@/content/legal/agb";
import { pageMetadata } from "@/lib/metadata";
import { CalendarDays, Mail, ScrollText } from "lucide-react";

export const metadata = pageMetadata({
  ...agbPage.metadata,
  canonical: "/agb",
});

export default function AgbPage() {
  const { hero } = agbPage;
  const effectiveDate = agbEffectiveDate.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <DocShell
      sections={agbSections}
      hero={
        <DocHero
          badge={hero.badge}
          icon={ScrollText}
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
                <TextLink variant="doc" href={`mailto:${agbContact.email}`}>
                  {agbContact.email}
                </TextLink>
              ),
            },
          ]}
        />
      }
    >
      <AgbProse />
    </DocShell>
  );
}
