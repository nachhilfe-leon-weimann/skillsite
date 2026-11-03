"use client";

import type { CSSProperties } from "react";

import { Text } from "@skillsite/ui/typography/text";
import { IconBadge } from "@skillsite/ui/primitives/icon-badge";
import { useInView } from "@skillsite/ui/hooks/use-in-view";
import { cn } from "@skillsite/ui/utils/cn";

type LessonStep = { n: string; title: string; text: string };

/**
 * The lesson-flow steps as a connected timeline: on scroll-in, the coral rail
 * draws from step 1 to 3 while each node pops and its copy rises, in sequence.
 * The rail segments use `flex-1`, so they always reach the next node regardless
 * of copy length. No-JS / reduced motion render the finished state (see CSS).
 */
export function LessonTimeline({ steps }: { steps: LessonStep[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} data-shown={inView || undefined} className="flex flex-col">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <div
            key={step.n}
            className="flex gap-4"
            style={{ "--reveal-index": i } as CSSProperties}
          >
            <div className="flex flex-col items-center">
              <IconBadge
                size="7.5"
                shape="full"
                className="tl-node shrink-0 text-small font-bold"
              >
                {step.n}
              </IconBadge>
              {!last ? (
                <span className="tl-line mt-1.5 w-0.5 flex-1 rounded-full bg-accent-tint-35" />
              ) : null}
            </div>
            <div className={cn("tl-body", !last && "pb-5")}>
              <strong className="block text-ink">{step.title}</strong>
              <Text as="span" tone="muted">
                {step.text}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}
