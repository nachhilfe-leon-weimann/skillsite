import assert from "node:assert/strict";
import { test, vi } from "vitest";

import { describeRejectedLink, logPayment } from "./log.ts";

test("every outcome is one greppable line at the matching level", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  logPayment("redirected", { invoice: "RE-1840", amount: "90.00" });
  logPayment("rejected", { reason: "invoice", length: 7, link: true });

  assert.deepEqual(info.mock.calls[0], [
    '[payment] redirected {"invoice":"RE-1840","amount":"90.00"}',
  ]);
  assert.deepEqual(warn.mock.calls[0], [
    '[payment] rejected {"reason":"invoice","length":7,"link":true}',
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

test("a rejected link logs its shape, never what was typed", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  // Synthetic: what a parent might type into the field instead of a number.
  const typed = ["erika.mustermann@example.com", "Erika Mustermann"];

  for (const re of typed) {
    logPayment("rejected", {
      reason: "invoice",
      ...describeRejectedLink({ re }),
    });
  }

  const lines = warn.mock.calls.map(([line]) => String(line));
  assert.deepEqual(lines, [
    '[payment] rejected {"reason":"invoice","length":28,"link":false}',
    '[payment] rejected {"reason":"invoice","length":16,"link":false}',
  ]);
  for (const line of lines) {
    assert.doesNotMatch(line, /erika|mustermann|example\.com/i);
  }
});

test("`link` tells a broken invoice template from a typed number", () => {
  assert.deepEqual(
    describeRejectedLink({ re: "RE/1840", betrag: "90,00 EUR" }),
    {
      length: 7,
      link: true,
    },
  );
  // A `betrag` parameter marks the link, whatever its value.
  assert.deepEqual(describeRejectedLink({ re: "RE/1840", betrag: "" }), {
    length: 7,
    link: true,
  });
  assert.deepEqual(describeRejectedLink({ re: "RE/1840" }), {
    length: 7,
    link: false,
  });
});

test("the length is the raw parameter's, 0 when there is no single value", () => {
  assert.deepEqual(describeRejectedLink({ re: "R".repeat(500) }), {
    length: 500,
    link: false,
  });
  assert.deepEqual(describeRejectedLink({}), { length: 0, link: false });
  assert.deepEqual(describeRejectedLink({ re: ["RE-1840", "RE-1841"] }), {
    length: 0,
    link: false,
  });
  assert.deepEqual(describeRejectedLink(null), { length: 0, link: false });
});

test("console is real again after a mocked test", () => {
  // restoreMocks: a spy from an earlier test must not swallow later output.
  assert.equal(vi.isMockFunction(console.info), false);
  assert.equal(vi.isMockFunction(console.warn), false);
  assert.equal(vi.isMockFunction(console.error), false);
});
