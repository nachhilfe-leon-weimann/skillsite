/**
 * Spike only (C7): the brand motion as Radix listens to it. Presence keeps an
 * element mounted only while a CSS *animation* runs on `data-state="closed"`, so
 * exit needs a keyframe; the brand has entrance keyframes only, so `fade` runs
 * reversed.
 */
export const motion =
  "data-[state=open]:animate-rise data-[state=closed]:animate-fade data-[state=closed]:[animation-direction:reverse]";
