"use client";

import { cn } from "../utils/cn";
import { useCountUp } from "../hooks/use-count-up";

type CountUpProps = {
  /** Stat string like "320+", "35+" or "3". Only the digits animate. */
  value: string;
  duration?: number;
  delay?: number;
  className?: string;
};

/** Splits "320+" into { prefix: "", to: 320, suffix: "+", decimals: 0 }. */
function parseStat(value: string) {
  const match = value.match(/^(\D*)([\d.,]+)(\D*)$/);
  if (!match) return null;
  const [, prefix = "", digits = "", suffix = ""] = match;
  const normalised = digits.replace(/\./g, "").replace(",", ".");
  const decimals = normalised.includes(".")
    ? (normalised.split(".")[1] ?? "").length
    : 0;
  return { prefix, suffix, to: Number(normalised), decimals };
}

export function CountUp({ value, duration, delay, className }: CountUpProps) {
  const parsed = parseStat(value);
  const { ref, display } = useCountUp<HTMLSpanElement>({
    to: parsed?.to ?? 0,
    duration,
    delay,
    decimals: parsed?.decimals ?? 0,
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
        {display}
        {parsed.suffix}
      </span>
    </span>
  );
}
