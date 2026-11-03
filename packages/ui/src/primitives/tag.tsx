import { cn } from "../utils/cn";

type TagProps = React.ComponentProps<"span"> & {
  tone?: "coral" | "navy" | "outline";
};

/** Small status pill (e.g. "Sehr gefragt", "Neu"). */
export function Tag({ tone = "coral", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "coral" &&
          "bg-[color-mix(in_srgb,var(--coral)_14%,transparent)] text-coral",
        tone === "navy" && "bg-navy text-white",
        tone === "outline" && "border border-line text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}
