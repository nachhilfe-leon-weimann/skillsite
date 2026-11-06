import assert from "node:assert/strict";
import { test, vi } from "vitest";

import { compact, createLogger, loggable } from "./log.ts";

test("an outcome is one line, tagged with its domain, at the outcome's level", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const log = createLogger("demo", {
    done: "info",
    skipped: "warn",
    broken: "error",
  });

  log("done", { id: "a" });
  log("skipped", {});
  log("broken", { reason: "x" });

  assert.deepEqual(info.mock.calls, [['[demo] done {"id":"a"}']]);
  assert.deepEqual(warn.mock.calls, [["[demo] skipped {}"]]);
  assert.deepEqual(error.mock.calls, [['[demo] broken {"reason":"x"}']]);
});

test("untrusted context stays on its line, so it cannot forge another entry", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const log = createLogger("demo", { done: "info" });

  log("done", { note: 'x"}\n[demo] done {"forged":true' });

  assert.equal(info.mock.calls.length, 1);
  assert.deepEqual(info.mock.calls[0], [
    '[demo] done {"note":"x\\"}\\n[demo] done {\\"forged\\":true"}',
  ]);
});

test("an untrusted value is logged as a string of at most 64 characters", () => {
  assert.equal(loggable("RE-1840"), "RE-1840");
  assert.equal(loggable("x".repeat(500)), "x".repeat(64));
  assert.equal(loggable(""), "");
  assert.equal(loggable(42), undefined);
  assert.equal(loggable(["a"]), undefined);
  assert.equal(loggable(undefined), undefined);
});

test("a context leaves out what could not be read", () => {
  assert.deepEqual(compact({ a: "x", b: undefined, c: 0, d: null, e: "" }), {
    a: "x",
    c: 0,
    d: null,
    e: "",
  });
  assert.deepEqual(compact({}), {});
});
