import { DocHero, DocShell } from "@/components/docs/doc-components";
import { ImpressumProse, impressumPage } from "@/content/legal/impressum";
import { pageMetadata } from "@/lib/metadata";
import { FileText } from "lucide-react";

export const metadata = pageMetadata({
  ...impressumPage.metadata,
  canonical: "/impressum",
});

export default function ImpressumPage() {
  const { hero } = impressumPage;
  return (
    <DocShell
      hero={
        <DocHero
          badge={hero.badge}
          icon={FileText}
          title={hero.title}
          lead={hero.lead}
        />
      }
    >
      <ImpressumProse />
    </DocShell>
  );
}
