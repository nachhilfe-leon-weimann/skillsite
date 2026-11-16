import assert from "node:assert/strict";
import { test, vi } from "vitest";

import { SWEEP_INTERVAL_MS, createSweeper } from "./sweeper";

test("the timer starts with the first record, stops when the store is empty and restarts", () => {
  vi.useFakeTimers();
  try {
    const store = new Set<string>();
    const sweeper = createSweeper({
      sweep: () => store.clear(),
      isEmpty: () => store.size === 0,
    });
    assert.equal(vi.getTimerCount(), 0);

    store.add("a");
    sweeper.ensureRunning();
    sweeper.ensureRunning();
    assert.equal(vi.getTimerCount(), 1);

    vi.advanceTimersByTime(SWEEP_INTERVAL_MS);
    assert.equal(store.size, 0);
    assert.equal(vi.getTimerCount(), 0);

    store.add("b");
    sweeper.ensureRunning();
    assert.equal(vi.getTimerCount(), 1);
  } finally {
    vi.clearAllTimers();
    vi.useRealTimers();
  }
});
