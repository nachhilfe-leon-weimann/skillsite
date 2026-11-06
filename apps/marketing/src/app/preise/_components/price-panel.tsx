import Link from "next/link";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { CheckList } from "@skillsite/ui/primitives/check-list";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Text } from "@skillsite/ui/typography/text";
import { lessonPrice, priceIncludes, pricingPage } from "@/content/pricing";
import { routes } from "@/lib/routes";
import { ArrowRight } from "lucide-react";

/** The price panel on /preise: the fixed price on navy, what it includes beside it. */
export function PricePanel() {
  const { panel } = pricingPage;
  return (
    <Card
      surface="frame"
      radius="3xl"
      className="grid overflow-hidden md:grid-cols-2"
    >
      <div className="flex flex-col justify-center bg-navy p-panel-pricing text-white">
        <Reveal trigger="mount" variant="rise-soft" delay={0}>
          <span className="font-semibold tracking-price-label text-accent-blue">
            {panel.label}
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
              {/* Label and space in one text node: split, the label can shape wider. */}
              {`${panel.firstMeeting} `}
              <ArrowRight className="size-4" />
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
  );
}
