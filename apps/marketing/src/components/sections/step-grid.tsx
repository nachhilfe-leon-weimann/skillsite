import { cn } from "@skillsite/ui/utils/cn";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Card } from "@skillsite/ui/primitives/card";
import { Heading } from "@skillsite/ui/typography/heading";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import type { Step } from "@/content/process";

type StepGridProps = {
  steps: Step[];
  /** Render each step inside a surface card (used on /ablauf). */
  card?: boolean;
  className?: string;
};

export function StepGrid({ steps, card = false, className }: StepGridProps) {
  return (
    <CardGrid className={className}>
      {steps.map((step, i) => (
        <Reveal
          key={step.n}
          variant="rise-soft"
          index={i}
          as={card ? Card : "div"}
          className={cn(card && "p-6")}
        >
          <span className="font-heading text-digit-lg font-extrabold leading-none text-coral">
            {step.n}
          </span>
          {step.title ? (
            <Heading
              as="h3"
              size="step-title"
              wrap="normal"
              tone="default"
              className="mt-3"
            >
              {step.title}
            </Heading>
          ) : null}
          <p className={cn("text-ink-soft", step.title ? "mt-2" : "mt-3")}>
            {step.text}
          </p>
        </Reveal>
      ))}
    </CardGrid>
  );
}
