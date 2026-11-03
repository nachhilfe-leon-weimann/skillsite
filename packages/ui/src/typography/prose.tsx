import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Prose: long legal text (AGB, Datenschutz, Impressum) on the prose tokens -
 * Tailwind's default sizes, named (styles/tokens.css). The page title is a
 * regular `Heading as="h1" size="h1"`.
   ------------------------------------------------------------------------- */
export function ProseH2({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-heading hyphens-heading text-prose-h2 font-bold tracking-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function ProseH3({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-heading hyphens-heading text-prose-h3 font-bold text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function ProseP({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-prose-body text-ink", className)} {...props} />;
}
