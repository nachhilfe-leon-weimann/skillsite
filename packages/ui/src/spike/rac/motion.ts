/**
 * Spike only (C7): the brand motion as React Aria listens to it. It waits for
 * every animation *or transition* on the element while `data-exiting` is set,
 * so one token transition covers enter and exit.
 */
export const motion =
  "transition-[opacity,translate] duration-base ease-flow data-entering:translate-y-3 data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-quick";
