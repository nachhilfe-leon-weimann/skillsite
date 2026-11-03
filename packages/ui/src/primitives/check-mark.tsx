import { cn } from "../utils/cn";

type CheckMarkProps = React.ComponentProps<"svg"> & {
  /** Extra classes for the stroke path (AnimatedCheckMark uses this to draw it). */
  pathClassName?: string;
};

/** The design's hand-tuned check glyph. Color comes from `currentColor`. */
export function CheckMark({
  className,
  pathClassName,
  ...props
}: CheckMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-4.75", className)}
      {...props}
    >
      <path
        d="M4 12.5l5 5L20 6.5"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pathClassName}
      />
    </svg>
  );
}
