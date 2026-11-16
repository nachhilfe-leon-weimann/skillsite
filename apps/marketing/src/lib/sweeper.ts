/** How often the in-memory client stores are swept for expired addresses. */
export const SWEEP_INTERVAL_MS = 60_000;

type SweeperOptions = {
  /** Forgets the expired entries of a store, using the current time. */
  readonly sweep: () => void;
  /** True while the store holds no address: the timer then stops itself. */
  readonly isEmpty: () => boolean;
  readonly intervalMs?: number;
};

/**
 * Runs a store's own expiry on a timer, so an address is forgotten even when no
 * further request arrives. The timer starts lazily on `ensureRunning()` (never at
 * import time), stops once the store is empty, and is `unref()`ed so it never
 * keeps the process alive.
 */
export function createSweeper({
  sweep,
  isEmpty,
  intervalMs = SWEEP_INTERVAL_MS,
}: SweeperOptions) {
  let timer: ReturnType<typeof setInterval> | undefined;

  function stop() {
    if (timer === undefined) return;
    clearInterval(timer);
    timer = undefined;
  }

  return {
    ensureRunning() {
      if (timer !== undefined) return;
      timer = setInterval(() => {
        sweep();
        if (isEmpty()) stop();
      }, intervalMs);
      timer.unref();
    },
  };
}
