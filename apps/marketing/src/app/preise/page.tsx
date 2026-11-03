import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Card } from "@skillsite/ui/primitives/card";
import { Button } from "@skillsite/ui/primitives/button";
import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import {
  lessonPrice,
  priceIncludes,
  fairConditions,
  paymentOptions,
  but,
} from "@/content/pricing";
import { pricingFaq } from "@/content/faqs";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight, ExternalLink } from "lucide-react";

export const metadata = pageMetadata({
  canonical: "/preise",
  title: "Preise",
  description:
    "Klare Preise ohne Überraschungen: 30 € pro 60 Minuten für alle angebotenen Fächer und Klassenstufen. BuT-Förderung ist möglich.",
});

export default function PricingPage() {
  return (
    <>
      <PageHeader
        align="center"
        eyebrow="Preise"
        title="Klare Preise ohne Überraschungen."
        titleClassName="max-w-[12em]"
      />

      <Container className="py-section-sm">
        <div className="mx-auto max-w-230">
          <div className="grid overflow-hidden rounded-3xl border border-line shadow-card md:grid-cols-2">
            <div className="flex flex-col justify-center bg-navy p-[clamp(2rem,4vw,2.75rem)] text-white">
              <Reveal trigger="mount" variant="rise-soft" delay={0}>
                <span className="font-semibold tracking-[0.04em] text-accent-blue">
                  Festpreis für jedes angebotene Fach
                </span>
              </Reveal>
              <Reveal
                trigger="mount"
                variant="settle"
                delay={160}
                className="my-2.5 flex items-baseline gap-2"
              >
                <span className="font-heading text-[clamp(3.6rem,8vw,5.2rem)] font-extrabold leading-none">
                  {lessonPrice.amount}
                </span>
                <Text as="span" tone="inverse-muted" className="text-[1.1rem]">
                  {lessonPrice.unit}
                </Text>
              </Reveal>
              <Reveal trigger="mount" variant="rise-soft" delay={360}>
                <Text tone="inverse-muted" className="mb-6">
                  {lessonPrice.note}
                </Text>
              </Reveal>
              <Reveal trigger="mount" variant="rise-soft" delay={480}>
                <Button asChild variant="primary" className="w-full sm:w-fit">
                  <Link href={routes.firstMeeting}>
                    Kostenloses Erstgespräch <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Reveal>
            </div>
            <div className="flex flex-col justify-center gap-3.5 bg-surface p-[clamp(2rem,4vw,2.75rem)]">
              <Reveal
                trigger="mount"
                variant="rise-soft"
                delay={220}
                className="flex flex-col gap-3.5"
              >
                {priceIncludes.map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <AnimatedCheckMark
                      index={index}
                      className="mt-0.5 size-5 shrink-0 text-coral"
                    />
                    <Text as="span">{item}</Text>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
      </Container>

      <Container className="py-section-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal variant="rise-soft" index={0}>
            <Card className="h-full p-7">
              <Heading as="h2" size="h4" className="mb-4">
                Faire Bedingungen
              </Heading>
              <div className="flex flex-col gap-3">
                {fairConditions.map((condition) => (
                  <Text key={condition.text} tone="muted">
                    {condition.strong ? (
                      <strong className="text-ink">{condition.strong} </strong>
                    ) : null}
                    {condition.text}
                  </Text>
                ))}
              </div>
            </Card>
          </Reveal>
          <Reveal variant="rise-soft" index={1}>
            <Card className="h-full p-7">
              <Heading as="h2" size="h4" className="mb-4">
                Zahlung und Abrechnung
              </Heading>
              <div className="flex flex-col gap-3">
                {paymentOptions.map((option) => (
                  <Text key={option.text} tone="muted">
                    {option.strong ? (
                      <strong className="text-ink">{option.strong} </strong>
                    ) : null}
                    {option.text}
                  </Text>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </Container>

      <Section id="but" surface>
        <div className="mb-8 flex flex-wrap justify-between items-end">
          <Reveal variant="rise-soft">
            <Eyebrow>Bildung und Teilhabe</Eyebrow>
            <Heading size="h3" className="mt-4 mb-2.5 max-w-[18em]">
              Geförderte Nachhilfe – unkompliziert abgerechnet.
            </Heading>
            <Text tone="muted" className="max-w-[38em]">
              {but.intro}
            </Text>
          </Reveal>
          <Reveal
            variant="rise-soft"
            delay={140}
            className="mt-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center"
          >
            <Text as="span" tone="muted" className="text-sm">
              Quelle: {but.officialInfo.source}
            </Text>
            <Button
              asChild
              variant="outline"
              aria-label={`${but.officialInfo.label} auf ${but.officialInfo.source} öffnen`}
            >
              <a
                href={but.officialInfo.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {but.officialInfo.label}
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
          </Reveal>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {but.steps.map((step, i) => (
            <Reveal
              key={step.n}
              variant="rise-soft"
              index={i}
              className="rounded-2xl border border-line bg-bg p-6"
            >
              <span className="font-heading text-[2rem] font-extrabold leading-none text-coral">
                {step.n}
              </span>
              <Text className="mt-3">{step.text}</Text>
            </Reveal>
          ))}
        </div>
      </Section>

      <FaqSection
        title="Häufige Fragen zu Preis und Zahlung"
        items={pricingFaq}
      />
      <CtaSection />
    </>
  );
}
