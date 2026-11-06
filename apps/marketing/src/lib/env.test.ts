import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

import { EnvError, parseServerEnv } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("without a Cal.com key the booking stays unconfigured", () => {
  assert.deepEqual(parseServerEnv({}), {});
  assert.deepEqual(parseServerEnv({ CAL_API_KEY: undefined }), {});
  assert.deepEqual(parseServerEnv({ CAL_API_KEY: "" }), {});
});

test("a key of the Cal.com shape is kept", () => {
  assert.deepEqual(parseServerEnv({ CAL_API_KEY: "cal_live_test123" }), {
    CAL_API_KEY: "cal_live_test123",
  });
});

test("a malformed key stops the server with a message that never shows the key", () => {
  for (const key of ["  ", "cal_live_test 123", "sk_wrong", "cal_test_123"]) {
    assert.throws(
      () => parseServerEnv({ CAL_API_KEY: key }),
      (error: unknown) => {
        assert.ok(error instanceof EnvError);
        assert.match(error.message, /^CAL_API_KEY is set but malformed: /);
        assert.match(error.message, /cal_live_/);
        assert.ok(!error.message.includes(key));
        return true;
      },
    );
  }
});

test("the environment is parsed once", async () => {
  vi.resetModules();
  vi.stubEnv("CAL_API_KEY", "cal_live_test123");
  const { serverEnv } = await import("@/lib/env");
  const first = serverEnv();
  vi.stubEnv("CAL_API_KEY", "");
  assert.equal(serverEnv(), first);
  assert.equal(serverEnv().CAL_API_KEY, "cal_live_test123");
});
