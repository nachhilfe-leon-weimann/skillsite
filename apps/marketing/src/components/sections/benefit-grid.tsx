import { AnimatedCheckMark } from "@skillsite/ui/motion/animated-check-mark";
import { Reveal } from "@skillsite/ui/motion/reveal";
import type { Benefit } from "@/content/home";

export function BenefitGrid({ items }: { items: Benefit[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((benefit, index) => (
        <Reveal
          key={benefit.title}
          variant="rise-soft"
          index={index}
          className="rounded-2xl border border-line bg-surface p-6 shadow-card"
        >
          <span className="mb-4 flex size-9.5 items-center justify-center rounded-xl bg-accent-tint-14 text-coral">
            <AnimatedCheckMark index={index} />
          </span>
          <h3 className="mb-1.5 font-heading text-card-title-sm font-bold text-ink">
            {benefit.title}
          </h3>
          <p className="text-card-body text-ink-soft">{benefit.text}</p>
        </Reveal>
      ))}
    </div>
  );
}
