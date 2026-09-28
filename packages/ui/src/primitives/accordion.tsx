"use client";

import { useId, useState } from "react";

import { cn } from "../utils/cn";

export type AccordionEntry = {
  question: string;
  answer: React.ReactNode;
};

/** Single-open accordion used for FAQ blocks. */
export function Accordion({
  items,
  className,
}: {
  items: AccordionEntry[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-card"
          >
            <h3 className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-heading text-[1.08rem] font-semibold text-ink"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7.5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl leading-none text-coral transition-transform duration-quick ease-soft",
                    isOpen && "rotate-45",
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            {/* grid 0fr<->1fr animates variable height; the inner div clips and
                carries `inert` so collapsed content stays out of focus/a11y but
                still renders (which `hidden` would prevent, killing the anim). */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-base ease-soft",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                inert={!isOpen}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    "px-6 pb-6 leading-relaxed text-ink-soft transition-[opacity,translate] duration-base ease-flow",
                    isOpen
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-1 opacity-0",
                  )}
                >
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
