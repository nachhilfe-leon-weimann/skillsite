import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@skillsite/ui/eyebrow";
import { LinkButton } from "@skillsite/ui/button";
import { Heading, Lead, Text } from "@skillsite/ui/typography";
import { Reveal } from "@skillsite/ui/reveal";
import { SectionHeader } from "@skillsite/ui/section-header";
import { StatGrid } from "@/components/sections/stat-grid";
import { StepGrid } from "@/components/sections/step-grid";
import { BenefitGrid } from "@/components/sections/benefit-grid";
import { SubjectCards } from "@/components/sections/subject-cards";
import { CtaSection } from "@/components/sections/cta-section";
import { ProfilePhoto } from "@/components/sections/profile-photo";
import { homeStats, benefits } from "@/content/home";
import { startSteps } from "@/content/process";
import { primaryCta, trustLine } from "@/content/site";
import { routes } from "@/lib/routes";
import { ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <Container className="pt-[clamp(2.5rem,7vw,5.25rem)] pb-[clamp(3rem,6vw,4.5rem)]">
        <div className="grid items-center gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Reveal trigger="mount" variant="rise-soft" index={0}>
              <Eyebrow>Nachhilfe in Mathematik, Informatik und Physik</Eyebrow>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={1}
              className="mt-4"
            >
              <Heading as="h1" size="display">
                Lernen, bis es{" "}
                <span className="relative whitespace-nowrap text-coral">
                  klick
                  <svg
                    viewBox="0 0 200 22"
                    preserveAspectRatio="none"
                    aria-hidden
                    className="absolute left-[-2%] bottom-[-0.16em] h-[0.42em] w-[104%] overflow-visible"
                  >
                    <path
                      d="M4 14 C 46 5, 150 4, 196 12"
                      pathLength={1}
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                      className="[stroke-dasharray:1] motion-safe:animate-draw"
                    />
                  </svg>
                </span>{" "}
                macht.
              </Heading>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={2}
              className="mt-6"
            >
              <Lead className="max-w-[30em]">
                Hi, ich bin Leon. Ich erkläre dir den Stoff so lange, bis er
                wirklich Sinn ergibt – persönlich, online und ohne
                Mindestlaufzeit.
              </Lead>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={3}
              className="mt-8 flex flex-wrap gap-3.5"
            >
              <LinkButton href={primaryCta.href} variant="primary" size="lg">
                {primaryCta.label} <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href={routes.subjects} variant="outline" size="lg">
                Fächer ansehen
              </LinkButton>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={4}
              className="mt-4"
            >
              <Text size="small" tone="muted">
                {trustLine}
              </Text>
            </Reveal>
          </div>

          <div className="relative">
            <Reveal trigger="mount" variant="settle" delay={200}>
              <ProfilePhoto aspect="4/5" />
            </Reveal>
            <Reveal
              trigger="mount"
              variant="fade"
              delay={480}
              className="absolute -left-4 bottom-8 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card"
            >
              <span className="font-heading text-[1.6rem] font-extrabold text-coral">
                30&nbsp;€
              </span>
              <Text size="caption" tone="muted" className="leading-tight">
                pro 60 Minuten
                <br />
                jedes angebotene Fach
              </Text>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="fade"
              delay={580}
              className="absolute -right-3.5 top-6 rounded-[14px] flex flex-row gap-2 items-center bg-navy px-4 py-2.5 text-[0.84rem] font-semibold text-white shadow-card"
            >
              Ohne Mindestlaufzeit <Check className="size-4" />
            </Reveal>
          </div>
        </div>
      </Container>

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
        <SectionHeader
          eyebrow="Drei Fächer, ein Anspruch"
          title="Mathe, Informatik und Physik – verstanden, nicht auswendig gelernt."
          titleClassName="max-w-[16em]"
        />
        <div className="mt-9">
          <SubjectCards />
        </div>
      </Section>

      {/* Process */}
      <Section surface>
        <SectionHeader
          eyebrow="So fängt es an"
          title="In drei Schritten zur ersten Stunde."
          className="mb-10"
        />
        <StepGrid steps={startSteps} className="gap-6" />
      </Section>

      {/* Benefits */}
      <Section>
        <SectionHeader
          eyebrow="Fair und unkompliziert"
          title="Nachhilfe mit klaren Bedingungen."
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
