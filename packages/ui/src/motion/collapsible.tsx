import { cn } from "../utils/cn";

type CollapsibleProps = React.ComponentProps<"div"> & {
  open: boolean;
};

/**
 * A panel that opens and closes by animating its height: grid rows 0fr <-> 1fr
 * animate a variable height. The inner element clips and is `inert` while
 * closed, so collapsed content stays out of focus and the accessibility tree but
 * still renders (which `hidden` would prevent, killing the animation). `id`,
 * `role`, `aria-*` and `className` go to that inner element.
 */
export function Collapsible({
  open,
  className,
  children,
  ...props
}: CollapsibleProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-base ease-soft",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div
        inert={!open}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
