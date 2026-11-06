import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Card } from "@skillsite/ui/primitives/card";
import { Button } from "@skillsite/ui/primitives/button";
import { SmartLink } from "@skillsite/ui/primitives/link";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { StepNumber } from "@skillsite/ui/typography/step-number";
import { Text } from "@skillsite/ui/typography/text";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { but, pricingPage } from "@/content/pricing";
import { pricingFaq } from "@/content/faqs";
import { pageMetadata } from "@/lib/metadata";
import { ExternalLink } from "lucide-react";
import { ConditionCards } from "./_components/condition-cards";
import { PricePanel } from "./_components/price-panel";

export const metadata = pageMetadata({
  canonical: "/preise",
  ...pricingPage.metadata,
});

export default function PricingPage() {
  const { header } = pricingPage;
  return (
    <>
      <PageHeader
        align="center"
        eyebrow={header.eyebrow}
        title={header.title}
        titleClassName="max-w-measure-12"
      />

      <Container className="py-section-sm">
        <div className="mx-auto max-w-230">
          <PricePanel />
        </div>
      </Container>

      <Container className="py-section-sm">
        <ConditionCards />
      </Container>

      <Section id="but" surface>
        <div className="mb-8 flex flex-wrap justify-between items-end">
          <Reveal variant="rise-soft">
            <Eyebrow>{pricingPage.but.eyebrow}</Eyebrow>
            <Heading size="h3" className="mt-4 mb-2.5 max-w-measure-18">
              {pricingPage.but.title}
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
              {/* Label and space in one text node: split, the label can shape wider. */}
              {`${pricingPage.but.sourceLabel} `}
              {but.officialInfo.source}
            </Text>
            <Button
              asChild
              variant="outline"
              aria-label={pricingPage.but.officialInfoLabel}
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
              <StepNumber size="sm">{step.n}</StepNumber>
              <Text className="mt-3">{step.text}</Text>
            </Reveal>
          ))}
        </CardGrid>
      </Section>

      <FaqSection title={pricingPage.faqTitle} items={pricingFaq} />
      <CtaSection />
    </>
  );
}
