import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const splitVariants = cva("grid", {
  variants: {
    align: {
      center: "items-center",
      start: "items-start",
      stretch: "items-stretch",
    },
    gap: {
      split: "gap-split",
      "split-hero": "gap-split-hero",
      "split-about": "gap-split-about",
      "5": "gap-5",
    },
    /** Column widths from `lg` on; one column below. */
    ratio: {
      "1/1": "lg:grid-cols-2",
      "1.15/0.85": "lg:grid-cols-[1.15fr_0.85fr]",
      "1.05/0.95": "lg:grid-cols-[1.05fr_0.95fr]",
      "0.9/1.1": "lg:grid-cols-[0.9fr_1.1fr]",
      "1.25/1": "lg:grid-cols-[1.25fr_1fr]",
    },
  },
  defaultVariants: { align: "center", gap: "split", ratio: "1/1" },
});

type SplitProps = React.ComponentProps<"div"> &
  VariantProps<typeof splitVariants>;

/** Two-column page layout (text beside media or a panel), stacked below `lg`. */
export function Split({ align, gap, ratio, className, ...props }: SplitProps) {
  return (
    <div
      className={cn(splitVariants({ align, gap, ratio }), className)}
      {...props}
    />
  );
}
