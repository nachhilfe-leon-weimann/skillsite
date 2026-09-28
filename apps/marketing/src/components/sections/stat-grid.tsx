import { cn } from "@skillsite/ui/utils/cn";
import { CountUp } from "@skillsite/ui/motion/count-up";

type StatItem = { value: string; label: string };

type StatGridProps = {
  items: StatItem[];
  size?: "lg" | "sm";
  className?: string;
  /** Count the numbers up when they scroll into view (opt-in). */
  animateValue?: boolean;
};

/** Hairline-separated stat band. Caller sets the column count via className. */
export function StatGrid({
  items,
  size = "lg",
  className,
  animateValue,
}: StatGridProps) {
  const lg = size === "lg";

  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden border border-line bg-line",
        lg ? "rounded-2xl" : "rounded-stat",
        className,
      )}
    >
      {items.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "bg-surface text-center",
            lg ? "px-5 py-7" : "px-3 py-4.5",
          )}
        >
          <div
            className={cn(
              "font-heading font-extrabold tracking-[-0.02em] text-ink",
              lg ? "text-stat" : "text-stat-sm",
            )}
          >
            {animateValue ? (
              <CountUp value={stat.value} delay={i * 120} />
            ) : (
              stat.value
            )}
          </div>
          <div
            className={cn(
              "text-ink-soft",
              lg ? "mt-1 text-stat-label" : "text-stat-label-sm",
            )}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
