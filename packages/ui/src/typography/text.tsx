import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Body text (site)
   ------------------------------------------------------------------------- */
export type TextSize = "lead" | "body" | "small" | "caption";
export type TextTone =
  "default" | "muted" | "on-navy" | "on-navy-soft" | "inherit";

const textSizeClass: Record<TextSize, string> = {
  lead: "text-lead",
  body: "text-body",
  small: "text-small",
  caption: "text-caption",
};

const textToneClass: Record<TextTone, string> = {
  default: "text-ink",
  muted: "text-ink-soft",
  "on-navy": "text-on-navy",
  "on-navy-soft": "text-on-navy-soft",
  inherit: "",
};

type TextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  as?: "p" | "span" | "div";
  size?: TextSize;
  tone?: TextTone;
};

export function Text({
  as: Tag = "p",
  size = "body",
  tone = "default",
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(textSizeClass[size], textToneClass[tone], className)}
      {...props}
    />
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
