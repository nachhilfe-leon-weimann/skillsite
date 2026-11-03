import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * IconButton: a round, bordered button that holds one icon (month and back
 * navigation, the menu toggle). The icon is the child and sets its own size.
 * A button with a `disabled` prop gets the disabled look; the others carry no
 * `disabled:` classes.
   ------------------------------------------------------------------------- */
const iconButtonVariants = cva(
  "flex items-center justify-center rounded-full border border-line text-ink",
  {
    variants: {
      size: {
        sm: "size-9",
        md: "size-10",
        lg: "size-11",
      },
      surface: {
        default: "bg-surface",
        inset: "bg-bg",
      },
      /** `border`: the border darkens on hover; `none`: no hover feedback (the menu toggle). */
      hover: {
        border: "transition-colors hover:border-ink",
        none: "",
      },
    },
    defaultVariants: { size: "md", surface: "default", hover: "border" },
  },
);

type IconButtonProps = Omit<React.ComponentProps<"button">, "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    /** The button has no text: its accessible name is required. */
    "aria-label": string;
  };

export function IconButton({
  size,
  surface,
  hover,
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        iconButtonVariants({ size, surface, hover }),
        props.disabled !== undefined &&
          "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
