import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Step number
 *
 * The large coral numeral that opens a step or principle card ("01", "02").
 * `size` picks one of the digit role sizes. `leading-none` comes after the
 * size on purpose: tailwind-merge drops a line height set before a font size.
   ------------------------------------------------------------------------- */
const stepNumberVariants = cva("font-heading", {
  variants: {
    size: {
      sm: "text-digit-sm",
      md: "text-digit-md",
      lg: "text-digit-lg",
    },
  },
});

export type StepNumberSize = NonNullable<
  VariantProps<typeof stepNumberVariants>["size"]
>;

type StepNumberProps = React.HTMLAttributes<HTMLElement> & {
  size: StepNumberSize;
  as?: "span" | "p" | "div";
};

export function StepNumber({
  as: Tag = "span",
  size,
  className,
  ...props
}: StepNumberProps) {
  return (
    <Tag
      className={cn(
        stepNumberVariants({ size }),
        "font-extrabold leading-none text-coral",
        className,
      )}
      {...props}
    />
  );
}
