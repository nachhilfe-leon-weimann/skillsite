import { cn } from "../utils/cn";

/** Small uppercase coral label with a leading dot. */
export function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.25 text-eyebrow uppercase text-coral",
        className,
      )}
      {...props}
    >
      <span className="size-1.75 shrink-0 rounded-full bg-coral" aria-hidden />
      {children}
    </span>
  );
}
