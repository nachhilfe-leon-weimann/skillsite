import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Headings (site)
 *
 * `size` maps to one class from the type scale (size + line-height + tracking +
 * weight live in globals `@theme`). Colour is inherited from the parent, so the
 * same heading works on light and navy surfaces.
   ------------------------------------------------------------------------- */
const headingVariants = cva("font-heading text-balance hyphens-heading", {
  variants: {
    size: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
      title: "text-title",
    },
  },
  defaultVariants: { size: "h2" },
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
  size,
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag className={cn(headingVariants({ size }), className)} {...props} />
  );
}
