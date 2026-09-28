"use client";

import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
  Ref,
} from "react";

import { cn } from "../utils/cn";
import { useInView } from "../hooks/use-in-view";

type RevealVariant = "rise" | "rise-soft" | "fade" | "settle";
type RevealTrigger = "in-view" | "mount";

const DEFAULT_STEP = 90;

/**
 * Mount-trigger runs a CSS keyframe so above-the-fold content paints without
 * waiting for hydration - no hidden-until-JS LCP hit. In-view goes through the
 * `.reveal` transition, gated by useInView (below-the-fold only).
 */
const MOUNT_ANIM: Record<RevealVariant, string> = {
  rise: "motion-safe:animate-rise",
  "rise-soft": "motion-safe:animate-rise-soft",
  fade: "motion-safe:animate-fade",
  settle: "motion-safe:animate-settle",
};

type RevealOwnProps = {
  variant?: RevealVariant;
  /** mount = keyframe on paint (above-the-fold / LCP); in-view = IO transition. */
  trigger?: RevealTrigger;
  /** Stagger position; delay resolves to index * step (ms). */
  index?: number;
  step?: number;
  /** Explicit delay in ms; wins over index. */
  delay?: number;
  /** Blur-to-sharp accent. In-view reveals only, small surfaces - never long
   *  text or the code block (per-frame text repaint). Ignored for mount. */
  blur?: boolean;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

/**
 * `as` renders another element or component (e.g. `Card`) as the revealed
 * element; its own props (e.g. `surface`) pass through. From a server
 * component, a component passed as `as` must be a client module.
 */
type RevealProps<T extends ElementType> = RevealOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof RevealOwnProps | "as">;

/**
 * Choreographed entrance wrapper. Renders server children inside a client
 * island, so the surrounding section stays a server component.
 */
export function Reveal<T extends ElementType = "div">({
  as,
  variant = "rise",
  trigger = "in-view",
  index,
  step = DEFAULT_STEP,
  delay,
  blur,
  threshold,
  rootMargin,
  className,
  children,
  style,
  ...rest
}: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  // Called unconditionally (rules of hooks); the ref is only attached on the
  // in-view path, so the mount path never spins up an observer.
  const { ref, inView } = useInView<HTMLElement>({ threshold, rootMargin });
  const delayMs = delay ?? (index != null ? index * step : undefined);

  if (trigger === "mount") {
    return (
      <Tag
        className={cn(MOUNT_ANIM[variant], className)}
        style={
          delayMs != null
            ? ({ ...style, animationDelay: `${delayMs}ms` } as CSSProperties)
            : style
        }
        {...rest}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      className={cn("reveal", className)}
      data-reveal={variant}
      data-shown={inView || undefined}
      data-blur={blur || undefined}
      style={
        delayMs != null
          ? ({ ...style, transitionDelay: `${delayMs}ms` } as CSSProperties)
          : style
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}
