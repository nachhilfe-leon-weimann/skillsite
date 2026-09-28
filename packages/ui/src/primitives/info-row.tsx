import { cn } from "../utils/cn";
import { Eyebrow } from "../typography/eyebrow";
import { Text } from "../typography/text";
import { IconBadge } from "./icon-badge";

type InfoRowProps = React.ComponentProps<"div"> & {
  /** The glyph; the row puts it in its badge. */
  icon: React.ReactNode;
  /** A label above the value (`summary`, `doc`). */
  label?: React.ReactNode;
  /**
   * `inverse`: one line on navy (the booker's details). `summary`: a labelled
   * value with a coral badge (the booked slot). `doc`: a labelled value in the
   * legal pages' small type, truncated.
   */
  variant?: "inverse" | "summary" | "doc";
};

/** An icon badge next to a value (and its label). The surface is the caller's. */
export function InfoRow({
  icon,
  label,
  variant = "inverse",
  className,
  children,
  ...props
}: InfoRowProps) {
  if (variant === "inverse") {
    return (
      <div
        className={cn("flex items-center gap-3 text-on-navy", className)}
        {...props}
      >
        <IconBadge size="8" shape="lg" tone="inverse" className="shrink-0">
          {icon}
        </IconBadge>
        <Text as="span" size="small" tone="inherit">
          {children}
        </Text>
      </div>
    );
  }

  const summary = variant === "summary";
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {summary ? (
        <IconBadge size="9" shape="lg" tone="accent-12" className="shrink-0">
          {icon}
        </IconBadge>
      ) : (
        <IconBadge
          layout="grid"
          size="9"
          shape="md"
          tone="muted"
          className="shrink-0"
        >
          {icon}
        </IconBadge>
      )}
      <div className="min-w-0">
        {summary ? (
          <Eyebrow as="p" dot={false} tone="muted">
            {label}
          </Eyebrow>
        ) : (
          <p className="text-prose-xs text-ink-soft">{label}</p>
        )}
        <p
          className={
            summary
              ? "font-heading font-bold text-ink"
              : "truncate text-prose-sm font-medium text-ink"
          }
        >
          {children}
        </p>
      </div>
    </div>
  );
}
