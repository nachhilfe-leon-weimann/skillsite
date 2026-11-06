import Link from "next/link";
import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Button } from "@skillsite/ui/primitives/button";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { Split } from "@skillsite/ui/layout/split";
import { StepGrid } from "@/components/sections/step-grid";
import { LessonTimeline } from "@/components/sections/lesson-timeline";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { startSteps, lessonFlow, processPage } from "@/content/process";
import { processFaq } from "@/content/faqs";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight } from "lucide-react";
import { DiscordPanel } from "./_components/discord-panel";

export const metadata = pageMetadata({
  canonical: "/ablauf",
  ...processPage.metadata,
});

export default function ProcessPage() {
  const { header, lesson, booking } = processPage;
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        titleClassName="max-w-measure-13"
        lead={header.lead}
      />

      <Container className="py-section-sm">
        <Reveal variant="rise-soft">
          <Heading size="h3" className="mb-8">
            {processPage.startTitle}
          </Heading>
        </Reveal>
        <StepGrid steps={startSteps} card />
      </Container>

      <Section surface>
        <Split>
          <div>
            <PageHeader
              variant="section"
              eyebrow={lesson.eyebrow}
              title={lesson.title}
              size="h3"
              className="mb-6"
            />
            <LessonTimeline steps={lessonFlow} />
          </div>

          <Reveal variant="rise-soft">
            <DiscordPanel />
          </Reveal>
        </Split>
      </Section>

      <Container className="py-section-sm text-center">
        <Reveal variant="rise-soft" index={0}>
          <Heading size="h3">{booking.title}</Heading>
        </Reveal>
        <Reveal variant="rise-soft" index={1}>
          <Text tone="muted" className="mx-auto mt-3 mb-7 max-w-measure-32">
            {booking.text}
          </Text>
        </Reveal>
        <Reveal variant="rise-soft" index={2}>
          <Button asChild variant="primary" size="lg">
            <Link href={routes.booking}>
              {booking.link} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </Container>

      <FaqSection id="faq" title={processPage.faqTitle} items={processFaq} />
      <CtaSection />
    </>
  );
}
