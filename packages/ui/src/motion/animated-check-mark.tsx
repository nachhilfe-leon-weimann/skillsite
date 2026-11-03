"use client";

import { CheckMark } from "../primitives/check-mark";
import { useInView } from "../hooks/use-in-view";

type AnimatedCheckMarkProps = {
  className?: string;
  /** Stagger position within its list - each item delays by index * step. */
  index?: number;
};

/**
 * CheckMark that strokes itself in once it scrolls into view (the brand's
 * hand-drawn "klick" idea applied to confirmation lists). Falls back to a
 * plain, fully-drawn check under reduced motion or no JS.
 */
export function AnimatedCheckMark({
  className,
  index,
}: AnimatedCheckMarkProps) {
  const { ref, inView } = useInView<SVGSVGElement>();

  return (
    <CheckMark
      ref={ref}
      data-shown={inView || undefined}
      className={className}
      pathClassName="check-draw"
      style={
        index ? ({ "--reveal-index": index } as React.CSSProperties) : undefined
      }
    />
  );
}
