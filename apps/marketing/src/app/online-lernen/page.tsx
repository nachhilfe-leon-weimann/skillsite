import Link from "next/link";
import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Tag } from "@skillsite/ui/primitives/tag";
import { Pill } from "@skillsite/ui/primitives/pill";
import { Button } from "@skillsite/ui/primitives/button";
import { SmartLink } from "@skillsite/ui/primitives/link";
import { Card } from "@skillsite/ui/primitives/card";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { Split } from "@skillsite/ui/layout/split";
import { CtaSection } from "@/components/sections/cta-section";
import { LessonTimeline } from "@/components/sections/lesson-timeline";
import { FaqSection } from "@/components/sections/faq-section";
import {
  discordSetup,
  lessonSteps,
  discordFeatures,
  onlineLearningPage,
  teamsNote,
  techNote,
} from "@/content/online-learning";
import { onlineFaq } from "@/content/faqs";
import { primaryCta } from "@/content/site";
import { discordInvite } from "@/content/socials";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { FeatureCards } from "./_components/feature-cards";
import { SetupSteps } from "./_components/setup-steps";

export const metadata = pageMetadata({
  canonical: "/online-lernen",
  ...onlineLearningPage.metadata,
});

export default function OnlineLearningPage() {
  const { header, setup, lesson, features } = onlineLearningPage;
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        titleClassName="max-w-measure-15"
        lead={header.lead}
      >
        <Button asChild variant="primary" size="lg">
          <Link href={primaryCta.href}>
            {primaryCta.label} <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <SmartLink href={discordInvite}>
            <SiDiscord className="size-4" aria-hidden />
            {/* Space and label in one text node: split, the label can shape wider. */}
            {` ${onlineLearningPage.joinServer}`}
          </SmartLink>
        </Button>
      </PageHeader>

      {/* Phase 1: the one-time setup */}
      <Container className="py-section-sm">
        <Reveal variant="rise-soft">
          <Heading size="h3" className="mb-1.5">
            {setup.title}
          </Heading>
        </Reveal>
        <Reveal variant="rise-soft" index={1}>
          <Text tone="muted" className="mb-8 max-w-measure-42">
            {setup.text}
          </Text>
        </Reveal>

        <SetupSteps steps={discordSetup} />

        {/* Join band: the server link right where it is needed */}
        <Reveal
          variant="rise-soft"
          as={Card}
          surface="subtle"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 px-6 py-5"
        >
          <Text className="font-medium">{setup.joinBand}</Text>
          <Button asChild variant="primary">
            <SmartLink href={discordInvite}>
              <SiDiscord className="size-4" aria-hidden />
              {/* Space and label in one text node: split, the label can shape wider. */}
              {` ${onlineLearningPage.joinServer}`}
            </SmartLink>
          </Button>
        </Reveal>
        <Reveal variant="rise-soft">
          <Text size="small" tone="muted" className="mt-3">
            {setup.note}
          </Text>
        </Reveal>
      </Container>

      {/* Phase 2: how a lesson runs */}
      <Section surface>
        <Split align="start" ratio="0.9/1.1">
          <PageHeader
            variant="section"
            eyebrow={lesson.eyebrow}
            title={lesson.title}
            lead={lesson.lead}
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

      {/* Server features */}
      <Container className="py-section-sm">
        <PageHeader
          variant="section"
          eyebrow={features.eyebrow}
          title={features.title}
          size="h3"
          titleClassName="max-w-measure-16"
          className="mb-9"
        />
        <FeatureCards items={discordFeatures} />
      </Container>

      {/* Microsoft Teams and the technical requirements */}
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
              {onlineLearningPage.techLabel}
            </Pill>
            <Text tone="muted">{techNote}</Text>
          </Reveal>
        </div>
      </Section>

      <FaqSection
        id="faq"
        title={onlineLearningPage.faqTitle}
        items={onlineFaq}
      />

      <CtaSection />
    </>
  );
}
