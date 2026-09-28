import Link from "next/link";
import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Tag } from "@skillsite/ui/primitives/tag";
import { Pill } from "@skillsite/ui/primitives/pill";
import { Button } from "@skillsite/ui/primitives/button";
import { SmartLink } from "@skillsite/ui/primitives/link";
import { Card } from "@skillsite/ui/primitives/card";
import { IconBadge } from "@skillsite/ui/primitives/icon-badge";
import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { Split } from "@skillsite/ui/layout/split";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import { CtaSection } from "@/components/sections/cta-section";
import { LessonTimeline } from "@/components/sections/lesson-timeline";
import { FaqSection } from "@/components/sections/faq-section";
import {
  discordSetup,
  lessonSteps,
  discordFeatures,
  teamsNote,
  techNote,
} from "@/content/online-learning";
import { onlineFaq } from "@/content/faqs";
import { primaryCta } from "@/content/site";
import { discordInvite } from "@/content/socials";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";

export const metadata = pageMetadata({
  canonical: "/online-lernen",
  title: "Online lernen",
  description:
    "So läuft Online-Nachhilfe über Discord: beitreten, persönlich freischalten lassen und in der ‚lounge‘ starten. Microsoft Teams ist ebenfalls möglich.",
});

export default function OnlineLearningPage() {
  return (
    <>
      <PageHeader
        eyebrow="Discord – unser Klassenzimmer"
        title="So läuft deine Nachhilfe über Discord."
        titleClassName="max-w-measure-15"
        lead="Discord ist unser Klassenzimmer – kostenlos und per App oder Browser schnell startklar. Den Zugriff auf die Unterrichtskanäle schalte ich persönlich frei. Microsoft Teams ist ebenfalls möglich."
      >
        <Button asChild variant="primary" size="lg">
          <Link href={primaryCta.href}>
            {primaryCta.label} <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <SmartLink href={discordInvite}>
            <SiDiscord className="size-4" aria-hidden /> Server beitreten
          </SmartLink>
        </Button>
      </PageHeader>

      {/* Phase 1 — Einmal einrichten */}
      <Container className="py-section-sm">
        <Reveal variant="rise-soft">
          <Heading size="h3" className="mb-1.5">
            Einmal einrichten – dann bist du dabei.
          </Heading>
        </Reveal>
        <Reveal variant="rise-soft" index={1}>
          <Text tone="muted" className="mb-8 max-w-measure-42">
            Das machst du genau einmal. Danach klickst du dich vor jeder Stunde
            einfach ein.
          </Text>
        </Reveal>

        <CardGrid>
          {discordSetup.map((step, i) => (
            <Reveal
              key={step.n}
              variant="rise-soft"
              index={i}
              as={Card}
              className="p-6"
            >
              <span className="font-heading text-digit-md font-extrabold leading-none text-coral">
                {step.n}
              </span>
              <Heading as="h3" size="title" className="mt-3 mb-1.5">
                {step.title}
              </Heading>
              <Text size="small" tone="muted">
                {step.text}
              </Text>
            </Reveal>
          ))}
        </CardGrid>

        {/* Beitreten-Band: Server-Link genau dort, wo er gebraucht wird */}
        <Reveal
          variant="rise-soft"
          as={Card}
          surface="subtle"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 px-6 py-5"
        >
          <Text className="font-medium">
            Sobald du Discord hast, komm auf den Server – ich schalte dich frei.
          </Text>
          <Button asChild variant="primary">
            <SmartLink href={discordInvite}>
              <SiDiscord className="size-4" aria-hidden /> Server beitreten
            </SmartLink>
          </Button>
        </Reveal>
        <Reveal variant="rise-soft">
          <Text size="small" tone="muted" className="mt-3">
            Das Erstgespräch führen wir ganz entspannt per Telefon. Discord
            brauchst du erst für die Nachhilfestunden.
          </Text>
        </Reveal>
      </Container>

      {/* Phase 2 — So läuft deine Stunde */}
      <Section surface>
        <Split align="start" ratio="0.9/1.1">
          <PageHeader
            variant="section"
            eyebrow="In vier Schritten"
            title="So läuft deine Stunde."
            lead="Sobald ich dich freigeschaltet habe, siehst du den Sprachkanal ‚lounge‘ und deinen persönlichen Textkanal ‚vorname-nachname‘. Zur Stunde brauchst du nur die ‚lounge‘ – der Rest passiert von selbst."
            size="h3"
          />
          <Reveal
            variant="rise-soft"
            as={Card}
            surface="inset"
            className="p-panel-timeline"
          >
            <LessonTimeline steps={lessonSteps} />
          </Reveal>
        </Split>
      </Section>

      {/* Server-Funktionen */}
      <Container className="py-section-sm">
        <PageHeader
          variant="section"
          eyebrow="Server-Funktionen"
          title="Dein Kanal – auch zwischen den Stunden."
          size="h3"
          titleClassName="max-w-measure-16"
          className="mb-9"
        />
        <CardGrid columns="md-2">
          {discordFeatures.map((feature, index) => (
            <Reveal
              key={feature.title}
              variant="rise-soft"
              index={index}
              as={Card}
              className="flex items-start gap-4 p-6"
            >
              <IconBadge className="shrink-0">
                <AnimatedCheckMark index={index} className="size-5" />
              </IconBadge>
              <div>
                <Heading as="h3" size="title" className="mb-1.5">
                  {feature.title}
                </Heading>
                <Text size="small" tone="muted">
                  {feature.text}
                </Text>
              </div>
            </Reveal>
          ))}
        </CardGrid>
      </Container>

      {/* Microsoft Teams + Technik */}
      <Section surface id="ms-teams">
        <div className="grid gap-5">
          <Reveal variant="rise-soft" as={Card} surface="inset" className="p-7">
            <div className="mb-3.5 flex items-center justify-between gap-4">
              <Heading as="h3" size="h4">
                {teamsNote.name}
              </Heading>
              <Tag>{teamsNote.tag}</Tag>
            </div>
            <Text tone="muted">{teamsNote.text}</Text>
          </Reveal>
          <Reveal
            variant="rise-soft"
            index={1}
            as={Card}
            surface="inset"
            className="flex flex-wrap items-center gap-3.5 px-6 py-6"
          >
            <Pill tone="accent" size="code">
              Technik
            </Pill>
            <Text tone="muted">{techNote}</Text>
          </Reveal>
        </div>
      </Section>

      <FaqSection id="faq" title="Gut zu wissen" items={onlineFaq} />

      <CtaSection />
    </>
  );
}
