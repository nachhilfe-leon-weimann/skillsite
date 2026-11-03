import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-coral-gradient text-white shadow-[0_14px_30px_-12px_var(--coral)] [--lift:-0.125rem]",
        secondary: "bg-navy text-white hover:opacity-90",
        outline:
          "border-[1.5px] border-line bg-transparent text-ink hover:border-ink",
        inverse:
          "bg-white text-navy shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)] [--lift:-0.125rem]",
        ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
      },
      size: {
        sm: "px-3.5 py-1.5 text-sm",
        md: "px-5 py-2.5 text-[1rem]",
        lg: "px-6 py-3 text-[1.05rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (e.g. a `Link` or an `<a>`) with the button's look instead of a `<button>`. */
    asChild?: boolean;
  };

export function Button({
  variant,
  size,
  asChild = false,
  className,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
