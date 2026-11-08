"use client";

import { cn } from "../utils/cn";
import { useCountUp } from "../hooks/use-count-up";
import { formatStatNumber, parseStatNumber } from "../utils/stat-number";

type CountUpProps = {
  /**
   * Stat string like "320+", "4,8" or "1.200+". Only the number animates, in
   * German notation: it keeps its decimal comma and thousands dot.
   */
  value: string;
  duration?: number;
  delay?: number;
  className?: string;
};

export function CountUp({ value, duration, delay, className }: CountUpProps) {
  const parsed = parseStatNumber(value);
  const { ref, value: current } = useCountUp<HTMLSpanElement>({
    to: parsed?.to ?? 0,
    duration,
    delay,
  });

  // Non-numeric values (nothing to animate) render verbatim.
  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span
      ref={ref}
      className={cn("relative inline-block tabular-nums", className)}
    >
      {/* Sizer: reserves the final width/height so counting never shifts layout. */}
      <span aria-hidden className="invisible">
        {value}
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center"
        suppressHydrationWarning
      >
        {parsed.prefix}
        {formatStatNumber(current, parsed)}
        {parsed.suffix}
      </span>
    </span>
  );
}
