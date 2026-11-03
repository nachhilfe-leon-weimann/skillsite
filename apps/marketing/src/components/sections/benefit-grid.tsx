import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Card } from "@skillsite/ui/primitives/card";
import { Heading } from "@skillsite/ui/typography/heading";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import type { Benefit } from "@/content/home";

export function BenefitGrid({ items }: { items: Benefit[] }) {
  return (
    <CardGrid columns="sm-2-lg-3">
      {items.map((benefit, index) => (
        <Reveal
          key={benefit.title}
          variant="rise-soft"
          index={index}
          as={Card}
          className="p-6"
        >
          <span className="mb-4 flex size-9.5 items-center justify-center rounded-xl bg-accent-tint-14 text-coral">
            <AnimatedCheckMark index={index} />
          </span>
          <Heading
            as="h3"
            size="card-title-sm"
            wrap="normal"
            tone="default"
            className="mb-1.5"
          >
            {benefit.title}
          </Heading>
          <p className="text-card-body text-ink-soft">{benefit.text}</p>
        </Reveal>
      ))}
    </CardGrid>
  );
}
