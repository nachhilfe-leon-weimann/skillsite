import { cn } from "../utils/cn";

/** Surface panel: bordered, rounded, soft shadow. Padding is set by the caller. */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        className,
      )}
      {...props}
    />
  );
}
