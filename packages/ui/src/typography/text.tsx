import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Body text
   ------------------------------------------------------------------------- */
const textVariants = cva("", {
  variants: {
    size: {
      lead: "text-lead",
      body: "text-body",
      small: "text-small",
      caption: "text-caption",
      /** Fine print: sources, legal notes, consent labels. */
      note: "text-note",
    },
    tone: {
      default: "text-ink",
      muted: "text-ink-soft",
      inverse: "text-on-navy",
      "inverse-soft": "text-on-navy-soft",
      inherit: "",
    },
  },
  defaultVariants: { size: "body", tone: "default" },
});

export type TextSize = NonNullable<VariantProps<typeof textVariants>["size"]>;
export type TextTone = NonNullable<VariantProps<typeof textVariants>["tone"]>;

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div";
  };

export function Text({
  as: Tag = "p",
  size,
  tone,
  className,
  ...props
}: TextProps) {
  return (
    <Tag className={cn(textVariants({ size, tone }), className)} {...props} />
  );
}

export function Address({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <address
      className={cn("text-body not-italic text-ink", className)}
      {...props}
    />
  );
}
