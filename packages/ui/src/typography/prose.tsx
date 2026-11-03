import { cn } from "../utils/cn";

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
