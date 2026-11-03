"use client";

import { useId, useState } from "react";

import { Collapsible } from "../motion/collapsible";
import { cn } from "../utils/cn";
import { Card } from "./card";
import { IconBadge } from "./icon-badge";

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
          <Card key={item.question} radius="xl" className="overflow-hidden">
            <h3 className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-heading text-accordion font-semibold text-ink"
              >
                <span>{item.question}</span>
                <IconBadge
                  aria-hidden
                  size="7.5"
                  shape="full"
                  tone="subtle"
                  className={cn(
                    "shrink-0 text-accordion-icon leading-none transition-transform duration-quick ease-soft",
                    isOpen && "rotate-45",
                  )}
                >
                  +
                </IconBadge>
              </button>
            </h3>
            <Collapsible
              open={isOpen}
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
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
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
