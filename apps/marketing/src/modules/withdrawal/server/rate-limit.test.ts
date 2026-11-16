import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";

import { WITHDRAWAL_ANTI_SPAM } from "../model/config";
import { clientKey } from "./rate-limit";

const { perClient, overall } = WITHDRAWAL_ANTI_SPAM.rateLimit;

// The limits live at module scope: every test imports a fresh copy.
beforeEach(() => {
  vi.resetModules();
});

const fresh = async () => import("./rate-limit");

test("an address over its limit is refused until its window has passed", async () => {
  const { checkClientLimit } = await fresh();
  for (let attempt = 0; attempt < perClient.max; attempt += 1) {
    assert.equal(checkClientLimit("192.0.2.1", attempt).ok, true);
  }
  assert.equal(checkClientLimit("192.0.2.1", perClient.max).ok, false);
  assert.equal(checkClientLimit("192.0.2.2", perClient.max).ok, true);
  assert.equal(checkClientLimit("192.0.2.1", perClient.windowMs).ok, true);
});

test("the addresses of one IPv6 /64 share one limit", async () => {
  const { checkClientLimit } = await fresh();
  for (let host = 1; host <= perClient.max; host += 1) {
    assert.equal(checkClientLimit(`2001:db8:1:2::${host}`, 0).ok, true);
  }
  assert.equal(checkClientLimit("2001:db8:1:2:ffff::9", 1).ok, false);
  assert.equal(checkClientLimit("2001:db8:1:3::1", 1).ok, true);
});

test("all declarations about to be sent are capped together", async () => {
  const { checkOverallLimit } = await fresh();
  for (let sent = 0; sent < overall.max; sent += 1) {
    assert.equal(checkOverallLimit(0).ok, true);
  }
  assert.equal(checkOverallLimit(1).ok, false);
  assert.equal(checkOverallLimit(overall.windowMs).ok, true);
});

test.each([
  ["192.0.2.1", "192.0.2.1"],
  ["::ffff:192.0.2.1", "192.0.2.1"],
  ["2001:db8:1:2::5", "2001:db8:1:2::/64"],
  ["2001:0DB8:0001:0002:aaaa:bbbb:cccc:dddd", "2001:db8:1:2::/64"],
  ["2001:db8::1", "2001:db8:0:0::/64"],
  ["::1", "0:0:0:0::/64"],
  ["unknown", "unknown"],
])("%s is limited as %s", (ip, key) => {
  assert.equal(clientKey(ip), key);
});
