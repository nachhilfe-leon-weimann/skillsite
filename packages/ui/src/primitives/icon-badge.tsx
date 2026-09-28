import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * IconBadge: an icon (or a digit) centred in a tinted square or circle. Sizes
 * are the measured ones, named by their spacing step; `shrink-0` and the type of
 * a digit are the caller's (not every badge sits in a flex row).
   ------------------------------------------------------------------------- */
const iconBadgeVariants = cva("", {
  variants: {
    /** How the icon is centred: a flex row, or a grid cell (the legal-page facts). */
    layout: {
      flex: "flex items-center justify-center",
      grid: "grid place-items-center",
    },
    size: {
      "7.5": "size-7.5",
      "8": "size-8",
      "9": "size-9",
      "9.5": "size-9.5",
      "10": "size-10",
      "13": "size-13",
      "14": "size-14",
    },
    shape: {
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    },
    tone: {
      /** Coral on the 14 % tint. */
      accent: "bg-accent-tint-14 text-coral",
      "accent-12": "bg-accent-tint-12 text-coral",
      /** The 16 % tint without a text colour: the state icons bring their own. */
      "accent-16": "bg-accent-tint-16",
      /** Coral on the second surface. */
      subtle: "bg-surface-2 text-coral",
      /** Muted ink on the second surface. */
      muted: "bg-surface-2 text-ink-soft",
      /** The light-blue icon on a white wash (navy panels). */
      inverse: "bg-overlay-8 text-accent-blue",
    },
  },
  defaultVariants: { layout: "flex", size: "10", shape: "xl", tone: "accent" },
});

type IconBadgeProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof iconBadgeVariants> & {
    as?: "span" | "div";
  };

export function IconBadge({
  as: Tag = "span",
  layout,
  size,
  shape,
  tone,
  className,
  ...props
}: IconBadgeProps) {
  return (
    <Tag
      className={cn(
        iconBadgeVariants({ layout, size, shape, tone }),
        className,
      )}
      {...props}
    />
  );
}
