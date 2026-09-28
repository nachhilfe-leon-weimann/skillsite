import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const tagVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-tag font-semibold",
  {
    variants: {
      tone: {
        accent: "bg-accent-tint-14 text-coral",
        inverse: "bg-navy text-white",
        outline: "border border-line text-ink-soft",
      },
    },
    defaultVariants: { tone: "accent" },
  },
);

type TagProps = React.ComponentProps<"span"> & VariantProps<typeof tagVariants>;

/** Small status pill (e.g. "Sehr gefragt", "Neu"). */
export function Tag({ tone, className, ...props }: TagProps) {
  return <span className={cn(tagVariants({ tone }), className)} {...props} />;
}
