import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Pill: a rounded label. Unlike `Tag` it sets no display, so it renders the way
 * its parent lays it out; a pill with an icon adds `inline-flex` itself. Tones
 * and sizes are the measured ones.
   ------------------------------------------------------------------------- */
const pillVariants = cva("rounded-full", {
  variants: {
    tone: {
      /** Outlined on coral or navy: a white wash border, white text. */
      inverse: "border border-overlay-25 text-white",
      /** Coral text on the card surface. */
      accent: "border border-line bg-surface text-coral",
      /** Muted text on the second surface (the legal-page badge). */
      muted: "border border-line bg-surface-2 text-ink-soft",
      /** A glass wash on coral; the text colour is the panel's. */
      "on-accent": "border border-overlay-35 bg-overlay-20",
    },
    size: {
      sm: "px-3.5 py-1.5 text-small font-semibold",
      /** Monospace caption (a technical label). */
      code: "px-3 py-1.5 font-mono text-caption",
      /** The legal pages' small text. */
      doc: "px-3 py-1 text-prose-sm",
      md: "px-5 py-2.5 font-semibold",
    },
  },
  defaultVariants: { tone: "muted", size: "sm" },
});

type PillProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof pillVariants> & {
    as?: "span" | "div";
  };

export function Pill({
  as: Tag = "span",
  tone,
  size,
  className,
  ...props
}: PillProps) {
  return (
    <Tag className={cn(pillVariants({ tone, size }), className)} {...props} />
  );
}
