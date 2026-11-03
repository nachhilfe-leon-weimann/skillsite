import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@skillsite/ui/layout/section-header";
import { Button } from "@skillsite/ui/primitives/button";
import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { StepGrid } from "@/components/sections/step-grid";
import { LessonTimeline } from "@/components/sections/lesson-timeline";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { startSteps, lessonFlow, discordHighlights } from "@/content/process";
import { processFaq } from "@/content/faqs";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight } from "lucide-react";

export const metadata = pageMetadata({
  canonical: "/ablauf",
  title: "Ablauf",
  description:
    "So läuft die Nachhilfe ab: kostenloses Erstgespräch, erste Stunde und flexible Termine. Online über Discord oder Microsoft Teams.",
});

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ablauf"
        title="So läuft die Nachhilfe bei mir ab."
        titleClassName="max-w-measure-13"
        lead="Kein Schema F. Wir klären zuerst, wo du stehst, und machen daraus einen Plan, der zu deinem Ziel passt."
      />

      <Container className="py-section-sm">
        <Reveal variant="rise-soft">
          <Heading size="h3" className="mb-8">
            Einstieg in drei Schritten
          </Heading>
        </Reveal>
        <StepGrid steps={startSteps} card />
      </Container>

      <Section surface>
        <div className="grid items-center gap-split lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Eine Stunde – 60 Minuten"
              title="So ist eine Stunde aufgebaut."
              size="h3"
              className="mb-6"
            />
            <LessonTimeline steps={lessonFlow} />
          </div>

          <Reveal variant="rise-soft">
            <div
              id="discord"
              className="rounded-3xl bg-navy p-panel text-on-navy shadow-card"
            >
              <Eyebrow dot={false} tone="inverse-accent">
                Unser Klassenzimmer
              </Eyebrow>
              <Heading as="h3" size="h4" className="mt-3.5 mb-2.5 text-white">
                Unterricht über Discord oder Microsoft Teams
              </Heading>
              <Text tone="inverse-soft" className="mb-4">
                Live mit geteiltem Bildschirm: wie am selben Tisch, nur ohne
                Anfahrt. Du wählst die Plattform, die für dich am einfachsten
                ist.
              </Text>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-overlay-25 px-3.5 py-1.5 text-small font-semibold text-white">
                  Discord
                </span>
                <span className="rounded-full border border-overlay-25 px-3.5 py-1.5 text-small font-semibold text-white">
                  Microsoft Teams
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {discordHighlights.map((highlight, index) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-2.5 text-on-navy"
                  >
                    <AnimatedCheckMark
                      index={index}
                      className="mt-0.5 size-4.5 shrink-0 text-coral-light"
                    />
                    <Text as="span" size="small" tone="inherit">
                      {highlight}
                    </Text>
                  </div>
                ))}
              </div>
              <Button asChild variant="inverse" className="mt-6">
                <Link href={routes.onlineLearning}>
                  So richtest du Discord ein <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      <Container className="py-section-sm text-center">
        <Reveal variant="rise-soft" index={0}>
          <Heading size="h3">Termine selbst buchen</Heading>
        </Reveal>
        <Reveal variant="rise-soft" index={1}>
          <Text tone="muted" className="mx-auto mt-3 mb-7 max-w-measure-32">
            Freie Slots direkt im Kalender wählen – wöchentlich, vor Klausuren
            intensiver oder nach Bedarf. Bis 24&nbsp;Stunden vorher kostenfrei
            absagen.
          </Text>
        </Reveal>
        <Reveal variant="rise-soft" index={2}>
          <Button asChild variant="primary" size="lg">
            <Link href={routes.booking}>
              Verfügbare Termine ansehen <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </Container>

      <FaqSection
        id="faq"
        title="Häufige Fragen zum Ablauf"
        items={processFaq}
      />
      <CtaSection />
    </>
  );
}
