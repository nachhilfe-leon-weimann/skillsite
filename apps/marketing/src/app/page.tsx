import type { Metadata } from "next";

import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { StatGrid } from "@/components/sections/stat-grid";
import { StepGrid } from "@/components/sections/step-grid";
import { SubjectCards } from "@/components/sections/subject-cards";
import { CtaSection } from "@/components/sections/cta-section";
import { homeStats, benefits, homeSections } from "@/content/home";
import { startSteps } from "@/content/process";
import { pageMetadata } from "@/lib/metadata";
import { BenefitGrid } from "./_components/benefit-grid";
import { Hero } from "./_components/hero";

export const metadata: Metadata = pageMetadata({ home: true });

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Stats */}
      <Container className="pb-section">
        <Reveal variant="rise-soft">
          <StatGrid
            items={homeStats}
            className="grid-cols-2 sm:grid-cols-4"
            animateValue
          />
        </Reveal>
      </Container>

      {/* Subjects teaser */}
      <Section>
        <PageHeader
          variant="section"
          eyebrow={homeSections.subjects.eyebrow}
          title={homeSections.subjects.title}
          titleClassName="max-w-measure-16"
        />
        <div className="mt-9">
          <SubjectCards />
        </div>
      </Section>

      {/* Process */}
      <Section surface>
        <PageHeader
          variant="section"
          eyebrow={homeSections.process.eyebrow}
          title={homeSections.process.title}
          className="mb-10"
        />
        <StepGrid steps={startSteps} className="gap-6" />
      </Section>

      {/* Benefits */}
      <Section>
        <PageHeader
          variant="section"
          eyebrow={homeSections.benefits.eyebrow}
          title={homeSections.benefits.title}
          className="mb-10"
        />
        <BenefitGrid items={benefits} />
      </Section>

      {/* Testimonials */}
      {/* <Section surface bleed>
        <Reveal variant="fade">
          <Testimonials />
        </Reveal>
      </Section> */}

      <CtaSection />
    </>
  );
}
