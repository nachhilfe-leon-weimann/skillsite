import assert from "node:assert/strict";
import { test, vi } from "vitest";

import { describeLink, logPayment } from "./log.ts";

test("every outcome is one greppable line at the matching level", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  logPayment("redirected", { invoice: "RE-1840", amount: "90.00" });
  logPayment("rejected", { reason: "invoice", re: "RE/1840" });

  assert.deepEqual(info.mock.calls[0], [
    '[payment] redirected {"invoice":"RE-1840","amount":"90.00"}',
  ]);
  assert.deepEqual(warn.mock.calls[0], [
    '[payment] rejected {"reason":"invoice","re":"RE/1840"}',
  ]);
});

test("each lookup outcome logs at the level its urgency asks for", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});

  logPayment("blocked", { invoice: "RE-1002" });
  logPayment("paid", { invoice: "RE-1003" });
  logPayment("not_payable", { invoice: "RE-1004" });
  logPayment("unavailable", { invoice: "RE-1005" });

  assert.deepEqual(info.mock.calls, [
    ['[payment] blocked {"invoice":"RE-1002"}'],
    ['[payment] paid {"invoice":"RE-1003"}'],
  ]);
  assert.deepEqual(warn.mock.calls, [
    ['[payment] not_payable {"invoice":"RE-1004"}'],
  ]);
  assert.deepEqual(error.mock.calls, [
    ['[payment] unavailable {"invoice":"RE-1005"}'],
  ]);
});

test("a rejected link is logged verbatim so a broken template is fixable", () => {
  assert.deepEqual(describeLink({ re: "RE-1840", betrag: "90,00 USD" }), {
    re: "RE-1840",
    betrag: "90,00 USD",
  });
});

test("untrusted link input is bounded and cannot forge a log entry", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  logPayment(
    "rejected",
    describeLink({ re: "R".repeat(500), betrag: "1\n[payment] redirected {}" }),
  );

  assert.deepEqual(warn.mock.calls[0], [
    `[payment] rejected {"re":"${"R".repeat(64)}","betrag":"1\\n[payment] redirected {}"}`,
  ]);
});

test("describing a malformed link never throws and omits what it can't read", () => {
  assert.deepEqual(describeLink({}), {});
  assert.deepEqual(describeLink({ re: "RE-1840" }), { re: "RE-1840" });
  assert.deepEqual(describeLink({ re: ["RE-1840", "RE-1841"] }), {});
  assert.deepEqual(describeLink({ re: undefined, betrag: undefined }), {});
});

test("console is real again after a mocked test", () => {
  // restoreMocks: a spy from an earlier test must not swallow later output.
  assert.equal(vi.isMockFunction(console.info), false);
  assert.equal(vi.isMockFunction(console.warn), false);
  assert.equal(vi.isMockFunction(console.error), false);
});
