import { cn } from "@skillsite/ui/utils/cn";

export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-page px-6", className)}
      {...props}
    />
  );
}
