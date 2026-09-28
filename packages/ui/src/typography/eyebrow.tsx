import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const eyebrowVariants = cva("text-eyebrow uppercase", {
  variants: {
    /** The leading dot; without it the label is a plain text element. */
    dot: {
      true: "inline-flex items-center gap-2.25",
      false: "",
    },
    tone: {
      accent: "text-coral",
      muted: "text-ink-soft",
      "inverse-accent": "text-accent-blue",
      "inverse-muted": "text-on-navy-muted",
      "on-accent": "text-on-accent-90",
    },
  },
  defaultVariants: { dot: true, tone: "accent" },
});

type EyebrowProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof eyebrowVariants> & {
    as?: "span" | "p";
  };

/** Small uppercase label above a heading; coral with a leading dot by default. */
export function Eyebrow({
  as: Tag = "span",
  dot = true,
  tone,
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <Tag className={cn(eyebrowVariants({ dot, tone }), className)} {...props}>
      {dot ? (
        <span
          className="size-1.75 shrink-0 rounded-full bg-coral"
          aria-hidden
        />
      ) : null}
      {children}
    </Tag>
  );
}
