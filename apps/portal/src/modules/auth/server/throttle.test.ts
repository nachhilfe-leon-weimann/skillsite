import { expect, test } from "vitest";

import { createLoginThrottle, LOGIN_THROTTLE } from "./throttle";

test("ten attempts per client pass within the window, the eleventh does not", () => {
  const throttle = createLoginThrottle({ now: () => 0 });
  for (let attempt = 0; attempt < LOGIN_THROTTLE.maxFailures; attempt += 1) {
    expect(throttle.begin("shared")).not.toBeNull();
  }
  expect(throttle.begin("shared")).toBeNull();
  // Another client has its own count.
  expect(throttle.begin("other")).not.toBeNull();
});

test("a forgiven attempt does not count", () => {
  const throttle = createLoginThrottle({ maxFailures: 1, now: () => 0 });
  const ticket = throttle.begin("shared");
  if (!ticket) throw new Error("refused");
  throttle.forgive(ticket);
  expect(throttle.begin("shared")).not.toBeNull();
});

test("the map of clients stays bounded", () => {
  const throttle = createLoginThrottle({ maxClients: 3, now: () => 0 });
  for (let client = 0; client < 10; client += 1) throttle.begin(`c${client}`);
  expect(throttle.trackedClients()).toBe(3);
});

test("clients whose attempts left the window are forgotten", () => {
  let clock = 0;
  const throttle = createLoginThrottle({ now: () => clock });
  throttle.begin("a");
  clock += LOGIN_THROTTLE.windowMs;
  throttle.begin("b");
  expect(throttle.trackedClients()).toBe(1);
});
