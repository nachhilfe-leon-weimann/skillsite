import { cn } from "../utils/cn";
import { Container } from "./container";

type SectionProps = React.ComponentProps<"section"> & {
  /** Full-bleed surface background with top/bottom hairlines. */
  surface?: boolean;
  /** Skip the inner Container (caller controls width). */
  bleed?: boolean;
  /** Vertical rhythm of the inner Container: `default` = py-section, `sm` = py-section-sm. */
  spacing?: "default" | "sm";
  containerClassName?: string;
};

/**
 * Page section. Wraps content in a centered Container with vertical rhythm.
 * Use `surface` for the alternating cream/white bands from the design.
 */
export function Section({
  surface,
  bleed,
  spacing = "default",
  id,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(surface && "border-y border-line bg-surface", className)}
      {...props}
    >
      {bleed ? (
        children
      ) : (
        <Container
          className={cn(
            spacing === "sm" ? "py-section-sm" : "py-section",
            containerClassName,
          )}
        >
          {children}
        </Container>
      )}
    </section>
  );
}
