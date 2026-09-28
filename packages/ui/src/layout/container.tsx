import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const containerVariants = cva("mx-auto", {
  variants: {
    size: {
      /** The site width (1280px). */
      page: "w-full max-w-page px-6",
      /** The FAQ column (820px). */
      faq: "max-w-205 px-6",
      /** The testimonials column (880px). */
      testimonials: "max-w-220 px-6",
    },
  },
  defaultVariants: { size: "page" },
});

type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants>;

/** Centred page column with the side gutter. */
export function Container({ size, className, ...props }: ContainerProps) {
  return (
    <div className={cn(containerVariants({ size }), className)} {...props} />
  );
}
