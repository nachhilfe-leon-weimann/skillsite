import { cn } from "@skillsite/ui/utils/cn";
import { Reveal } from "@skillsite/ui/motion/reveal";
import type { Step } from "@/content/process";

type StepGridProps = {
  steps: Step[];
  /** Render each step inside a surface card (used on /ablauf). */
  card?: boolean;
  className?: string;
};

export function StepGrid({ steps, card = false, className }: StepGridProps) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-3", className)}>
      {steps.map((step, i) => (
        <Reveal
          key={step.n}
          variant="rise-soft"
          index={i}
          className={cn(
            card && "rounded-2xl border border-line bg-surface p-6 shadow-card",
          )}
        >
          <span className="font-heading text-[2.4rem] font-extrabold leading-none text-coral">
            {step.n}
          </span>
          {step.title ? (
            <h3 className="mt-3 font-heading text-[1.2rem] font-bold text-ink">
              {step.title}
            </h3>
          ) : null}
          <p className={cn("text-ink-soft", step.title ? "mt-2" : "mt-3")}>
            {step.text}
          </p>
        </Reveal>
      ))}
    </div>
  );
}
