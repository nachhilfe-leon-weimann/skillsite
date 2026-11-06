import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Card } from "@skillsite/ui/primitives/card";
import { IconBadge } from "@skillsite/ui/primitives/icon-badge";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import type { Feature } from "@/content/online-learning";

/** The Discord server's features on /online-lernen, each card led by a check mark. */
export function FeatureCards({ items }: { items: Feature[] }) {
  return (
    <CardGrid columns="md-2">
      {items.map((feature, index) => (
        <Reveal
          key={feature.title}
          variant="rise-soft"
          index={index}
          as={Card}
          className="flex items-start gap-4 p-6"
        >
          <IconBadge className="shrink-0">
            <AnimatedCheckMark index={index} className="size-5" />
          </IconBadge>
          <div>
            <Heading as="h3" size="title" className="mb-1.5">
              {feature.title}
            </Heading>
            <Text size="small" tone="muted">
              {feature.text}
            </Text>
          </div>
        </Reveal>
      ))}
    </CardGrid>
  );
}
