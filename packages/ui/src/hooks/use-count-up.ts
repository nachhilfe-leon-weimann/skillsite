"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useInView } from "./use-in-view";

// useLayoutEffect warns during SSR (it no-ops there); fall back to useEffect on
// the server. The chosen hook is fixed per environment, so it's always called.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type CountUpOptions = {
  to: number;
  from?: number;
  /** Total ramp time in ms. */
  duration?: number;
  /** Stagger offset in ms before counting starts. */
  delay?: number;
};

/**
 * Counts a number up once it scrolls into view (rAF, ease-out). SSR/no-JS and
 * reduced motion resolve straight to the end value. The value starts at the end
 * value in state (so the SSR markup is correct), then a layout effect drops it
 * to `from` before the first client paint - no flash of the final number.
 */
export function useCountUp<T extends Element = HTMLSpanElement>({
  to,
  from = 0,
  duration = 1000,
  delay = 0,
}: CountUpOptions) {
  const { ref, inView } = useInView<T>();
  const [value, setValue] = useState(to);
  const started = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    setValue(from);
  }, [from]);

  useEffect(() => {
    if (!inView || started.current) return;
    // Reduced motion: the value already sits at the end value (the layout effect
    // only drops to `from` when motion is allowed), so there's nothing to animate.
    if (prefersReducedMotion()) return;
    started.current = true;

    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [inView, to, from, duration, delay]);

  return { ref, value };
}
