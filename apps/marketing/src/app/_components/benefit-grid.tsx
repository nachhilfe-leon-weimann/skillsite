import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Card } from "@skillsite/ui/primitives/card";
import { IconBadge } from "@skillsite/ui/primitives/icon-badge";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
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
          <IconBadge size="9.5" className="mb-4">
            <AnimatedCheckMark index={index} />
          </IconBadge>
          <Heading
            as="h3"
            size="card-title-sm"
            wrap="normal"
            tone="default"
            className="mb-1.5"
          >
            {benefit.title}
          </Heading>
          <Text tone="muted" className="text-card-body">
            {benefit.text}
          </Text>
        </Reveal>
      ))}
    </CardGrid>
  );
}
