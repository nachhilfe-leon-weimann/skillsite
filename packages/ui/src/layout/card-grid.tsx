import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const cardGridVariants = cva("grid", {
  variants: {
    gap: {
      "5": "gap-5",
      "4": "gap-4",
    },
    /** Columns per breakpoint; one column below the first. */
    columns: {
      "sm-3": "sm:grid-cols-3",
      "sm-2": "sm:grid-cols-2",
      "sm-2-lg-3": "sm:grid-cols-2 lg:grid-cols-3",
      "md-2": "md:grid-cols-2",
    },
  },
  defaultVariants: { gap: "5", columns: "sm-3" },
});

type CardGridProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardGridVariants>;

/** Grid of equal cards. */
export function CardGrid({ gap, columns, className, ...props }: CardGridProps) {
  return (
    <div
      className={cn(cardGridVariants({ gap, columns }), className)}
      {...props}
    />
  );
}
