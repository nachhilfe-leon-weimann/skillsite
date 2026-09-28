"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates its height to follow its content (a ResizeObserver on the inner
 * element), e.g. when a panel swaps one step for another. `className` goes to
 * the inner element that holds the content.
 */
export function AnimatedHeight({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{ height }}
      className="overflow-hidden motion-safe:transition-[height] motion-safe:duration-slow motion-safe:ease-soft"
    >
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  );
}
