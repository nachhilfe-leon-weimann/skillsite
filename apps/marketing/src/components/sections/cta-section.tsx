import { Container } from "@/components/layout/container";
import { LinkButton } from "@skillsite/ui/primitives/button";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { primaryCta, trustLine } from "@/content/site";
import { ArrowRight } from "lucide-react";

type CtaSectionProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  trust?: string;
};

/** Coral closing call-to-action used at the bottom of most pages. */
export function CtaSection({
  eyebrow = "Bereit?",
  title = "Der erste Schritt kostet nichts.",
  subtitle = "Im Erstgespräch klären wir dein Ziel und schauen gemeinsam, ob es passt.",
  cta = primaryCta,
  trust = trustLine,
}: CtaSectionProps) {
  return (
    <Container className="py-section">
      <Reveal
        variant="rise-soft"
        className="relative overflow-hidden rounded-3xl bg-coral-gradient p-[clamp(2.5rem,6vw,4.5rem)] text-center text-white shadow-[0_30px_60px_-30px_var(--coral)]"
      >
        <span className="text-eyebrow uppercase text-white/90">{eyebrow}</span>
        <Heading size="h2" className="mx-auto mt-4 max-w-[14em]">
          {title}
        </Heading>
        <Text
          size="lead"
          tone="inherit"
          className="mx-auto mt-4 max-w-[30em] text-white/90"
        >
          {subtitle}
        </Text>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <LinkButton href={cta.href} variant="white" size="lg">
            {cta.label} <ArrowRight className="size-4" />
          </LinkButton>
        </div>
        <Text size="small" tone="inherit" className="mt-4 text-white/85">
          {trust}
        </Text>
      </Reveal>
    </Container>
  );
}
