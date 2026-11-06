import { Card } from "@skillsite/ui/primitives/card";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { StepNumber } from "@skillsite/ui/typography/step-number";
import { Text } from "@skillsite/ui/typography/text";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import type { SetupStep } from "@/content/online-learning";

/** The one-time Discord setup on /online-lernen, one numbered card per step. */
export function SetupSteps({ steps }: { steps: SetupStep[] }) {
  return (
    <CardGrid>
      {steps.map((step, i) => (
        <Reveal
          key={step.n}
          variant="rise-soft"
          index={i}
          as={Card}
          className="p-6"
        >
          <StepNumber size="md">{step.n}</StepNumber>
          <Heading as="h3" size="title" className="mt-3 mb-1.5">
            {step.title}
          </Heading>
          <Text size="small" tone="muted">
            {step.text}
          </Text>
        </Reveal>
      ))}
    </CardGrid>
  );
}
