import Link from "next/link";

import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "navy" | "outline" | "white" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-coral-gradient text-white shadow-[0_14px_30px_-12px_var(--coral)] [--lift:-0.125rem]",
  navy: "bg-navy text-white hover:opacity-90",
  outline:
    "border-[1.5px] border-line bg-transparent text-ink hover:border-ink",
  white:
    "bg-white text-navy shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)] [--lift:-0.125rem]",
  ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-[1rem]",
  lg: "px-6 py-3 text-[1.05rem]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variantClasses[variant], sizeClasses[size], className);
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}

type LinkButtonProps = React.ComponentProps<"a"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Force external rendering (plain <a>). Auto-detected for http/mailto/tel. */
  external?: boolean;
};

export function LinkButton({
  href,
  variant,
  size,
  className,
  external,
  ...props
}: LinkButtonProps) {
  const classes = buttonClasses({ variant, size, className });
  const isExternal = external ?? /^(https?:|mailto:|tel:)/.test(href);

  if (isExternal) {
    return <a href={href} className={classes} {...props} />;
  }

  return <Link href={href} className={classes} {...props} />;
}
