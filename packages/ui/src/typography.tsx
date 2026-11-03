import { cn } from "./utils";

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

/** Intro paragraph — lead size, muted tone. */
export function Lead({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <Text size="lead" tone="muted" className={className} {...props} />;
}

/* ----------------------------------------------------------------------------
 * Prose / legal documents (variant-based, used by the doc components)
   ------------------------------------------------------------------------- */
type Variant = "site" | "doc";
type ProseHeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  variant?: Variant;
};

export function H1({
  className,
  variant = "site",
  ...props
}: ProseHeadingProps) {
  return (
    <h1
      className={cn(
        "font-heading text-balance hyphens-heading",
        variant === "site" ? "text-display" : "text-h1",
        className,
      )}
      {...props}
    />
  );
}

export function H2({
  className,
  variant = "site",
  ...props
}: ProseHeadingProps) {
  return (
    <h2
      className={cn(
        "font-heading hyphens-heading",
        variant === "site"
          ? "text-h2"
          : "text-2xl font-bold tracking-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function H3({
  className,
  variant = "site",
  ...props
}: ProseHeadingProps) {
  return (
    <h3
      className={cn(
        "font-heading hyphens-heading",
        variant === "site" ? "text-h3" : "text-lg font-bold text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function P({
  className,
  variant = "site",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { variant?: Variant }) {
  return (
    <p
      className={cn(
        "text-ink",
        variant === "doc" ? "leading-7" : "text-body",
        className,
      )}
      {...props}
    />
  );
}

export function Small({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-small text-ink-soft", className)} {...props} />;
}

export function Muted({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-small text-ink-soft", className)} {...props} />;
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

type InlineLinkProps = React.ComponentProps<"a"> & { variant?: Variant };

export function InlineLink({
  className,
  variant = "site",
  ...props
}: InlineLinkProps) {
  return (
    <a
      className={cn(
        "font-medium text-coral underline transition-colors hover:text-coral-2",
        variant === "doc" ? "underline-offset-[3px]" : "underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}
