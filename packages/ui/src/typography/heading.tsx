import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Headings
 *
 * `size` maps to one class from the type scale (size + line-height + tracking +
 * weight live in `@theme`), or to a role size outside the scale (card and step
 * titles: size token + bold). `tone` sets the colour; the default `inherit`
 * takes it from the parent, so the same heading works on light and navy
 * surfaces. `wrap="normal"` drops the balanced, hyphenated wrapping.
   ------------------------------------------------------------------------- */
const headingVariants = cva("font-heading", {
  variants: {
    wrap: {
      balance: "text-balance hyphens-heading",
      normal: "",
    },
    size: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
      title: "text-title",
      "card-title": "text-card-title font-bold",
      "card-title-sm": "text-card-title-sm font-bold",
      "step-title": "text-step-title font-bold",
    },
    tone: {
      inherit: "",
      default: "text-ink",
      muted: "text-ink-soft",
      inverse: "text-on-navy",
      "inverse-soft": "text-on-navy-soft",
    },
  },
  defaultVariants: { wrap: "balance", size: "h2", tone: "inherit" },
});

export type HeadingSize = NonNullable<
  VariantProps<typeof headingVariants>["size"]
>;

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  };

export function Heading({
  as: Tag = "h2",
  wrap,
  size,
  tone,
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(headingVariants({ wrap, size, tone }), className)}
      {...props}
    />
  );
}
