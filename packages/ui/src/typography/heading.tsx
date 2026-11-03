import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Headings (site)
 *
 * `size` maps to one class from the type scale (size + line-height + tracking +
 * weight live in globals `@theme`). Colour is inherited from the parent, so the
 * same heading works on light and navy surfaces.
   ------------------------------------------------------------------------- */
export type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4" | "title";

const headingSizeClass: Record<HeadingSize, string> = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  title: "text-title",
};

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  size?: HeadingSize;
};

export function Heading({
  as: Tag = "h2",
  size = "h2",
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(
        "font-heading text-balance hyphens-heading",
        headingSizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
