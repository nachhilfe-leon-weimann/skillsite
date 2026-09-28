"use client";

import { cn } from "../utils/cn";
import { AnimatedCheckMark } from "../motion/animated-check-mark";
import { Text } from "../typography/text";

type CheckListProps = React.ComponentProps<"div"> & {
  items: string[];
  /** `md`: body text, 20px marks; `sm`: small text, 18px marks, tighter gaps. */
  size?: "md" | "sm";
  /** `inverse`: on navy (light text, light coral marks). */
  tone?: "default" | "inverse";
};

/**
 * A list of short statements, each behind a check mark that draws itself in.
 * A client module so a server page can pass it to `Reveal as={CheckList}`.
 */
export function CheckList({
  items,
  size = "md",
  tone = "default",
  className,
  ...props
}: CheckListProps) {
  const md = size === "md";
  const inverse = tone === "inverse";
  return (
    <div
      className={cn("flex flex-col", md ? "gap-3.5" : "gap-3", className)}
      {...props}
    >
      {items.map((item, index) => (
        <div
          key={item}
          className={cn(
            "flex items-start",
            md ? "gap-3" : "gap-2.5",
            inverse && "text-on-navy",
          )}
        >
          <AnimatedCheckMark
            index={index}
            className={cn(
              "mt-0.5 shrink-0",
              md ? "size-5" : "size-4.5",
              inverse ? "text-coral-light" : "text-coral",
            )}
          />
          <Text
            as="span"
            size={md ? "body" : "small"}
            tone={inverse ? "inherit" : "default"}
          >
            {item}
          </Text>
        </div>
      ))}
    </div>
  );
}
