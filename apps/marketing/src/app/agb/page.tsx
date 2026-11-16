import { DocHero, DocShell } from "@/components/docs/doc-components";
import { TextLink } from "@skillsite/ui/primitives/link";
import {
  agbContact,
  agbEffectiveDateLabel,
  agbSections,
} from "@/content/agb";
import { AgbProse, agbPage } from "@/content/legal/agb";
import { pageMetadata } from "@/lib/metadata";
import { CalendarDays, Mail, ScrollText } from "lucide-react";

export const metadata = pageMetadata({
  ...agbPage.metadata,
  canonical: "/agb",
});

export default function AgbPage() {
  const { hero } = agbPage;

  return (
    <DocShell
      sections={agbSections.sections}
      hero={
        <DocHero
          badge={hero.badge}
          icon={ScrollText}
          title={hero.title}
          lead={hero.lead}
          downloads={hero.downloads}
          facts={[
            {
              icon: CalendarDays,
              label: hero.facts.effectiveDate,
              children: <>{agbEffectiveDateLabel}</>,
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
