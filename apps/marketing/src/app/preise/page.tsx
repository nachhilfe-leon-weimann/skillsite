import Link from "next/link";
import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Card } from "@skillsite/ui/primitives/card";
import { Button } from "@skillsite/ui/primitives/button";
import { SmartLink } from "@skillsite/ui/primitives/link";
import { CheckList } from "@skillsite/ui/primitives/check-list";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
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
        titleClassName="max-w-measure-12"
      />

      <Container className="py-section-sm">
        <div className="mx-auto max-w-230">
          <Card
            surface="frame"
            radius="3xl"
            className="grid overflow-hidden md:grid-cols-2"
          >
            <div className="flex flex-col justify-center bg-navy p-panel-pricing text-white">
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
                <span className="font-heading text-price font-extrabold leading-none">
                  {lessonPrice.amount}
                </span>
                <Text as="span" tone="inverse-soft" className="text-price-unit">
                  {lessonPrice.unit}
                </Text>
              </Reveal>
              <Reveal trigger="mount" variant="rise-soft" delay={360}>
                <Text tone="inverse-soft" className="mb-6">
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
            <div className="flex flex-col justify-center gap-3.5 bg-surface p-panel-pricing">
              <Reveal
                as={CheckList}
                items={priceIncludes}
                trigger="mount"
                variant="rise-soft"
                delay={220}
              />
            </div>
          </Card>
        </div>
      </Container>

      <Container className="py-section-sm">
        <CardGrid columns="md-2">
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
        </CardGrid>
      </Container>

      <Section id="but" surface>
        <div className="mb-8 flex flex-wrap justify-between items-end">
          <Reveal variant="rise-soft">
            <Eyebrow>Bildung und Teilhabe</Eyebrow>
            <Heading size="h3" className="mt-4 mb-2.5 max-w-measure-18">
              Geförderte Nachhilfe – unkompliziert abgerechnet.
            </Heading>
            <Text tone="muted" className="max-w-measure-38">
              {but.intro}
            </Text>
          </Reveal>
          <Reveal
            variant="rise-soft"
            delay={140}
            className="mt-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center"
          >
            <Text as="span" size="note" tone="muted">
              Quelle: {but.officialInfo.source}
            </Text>
            <Button
              asChild
              variant="outline"
              aria-label={`${but.officialInfo.label} auf ${but.officialInfo.source} öffnen`}
            >
              <SmartLink href={but.officialInfo.href}>
                {but.officialInfo.label}
                <ExternalLink className="size-4" aria-hidden />
              </SmartLink>
            </Button>
          </Reveal>
        </div>

        <CardGrid>
          {but.steps.map((step, i) => (
            <Reveal
              key={step.n}
              variant="rise-soft"
              index={i}
              as={Card}
              surface="inset"
              className="p-6"
            >
              <span className="font-heading text-digit-sm font-extrabold leading-none text-coral">
                {step.n}
              </span>
              <Text className="mt-3">{step.text}</Text>
            </Reveal>
          ))}
        </CardGrid>
      </Section>

      <FaqSection
        title="Häufige Fragen zu Preis und Zahlung"
        items={pricingFaq}
      />
      <CtaSection />
    </>
  );
}
