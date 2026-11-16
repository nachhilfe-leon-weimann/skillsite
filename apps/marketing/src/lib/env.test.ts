import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

import { EnvError, parseServerEnv, withdrawalMailConfig } from "@/lib/env";

// Synthetic values only: no real tenant, app, secret or mailbox.
const graphEnv = {
  GRAPH_TENANT_ID: "00000000-0000-4000-8000-000000000001",
  GRAPH_CLIENT_ID: "00000000-0000-4000-8000-000000000002",
  GRAPH_CLIENT_SECRET: "synthetic~secret.value",
  WITHDRAWAL_MAILBOX: "widerruf@example.com",
};

test("the withdrawal mail settings are kept when all four are well-formed", () => {
  const env = parseServerEnv(graphEnv);
  assert.deepEqual(env, graphEnv);
  assert.deepEqual(withdrawalMailConfig(env), {
    tenantId: graphEnv.GRAPH_TENANT_ID,
    clientId: graphEnv.GRAPH_CLIENT_ID,
    clientSecret: graphEnv.GRAPH_CLIENT_SECRET,
    mailbox: graphEnv.WITHDRAWAL_MAILBOX,
  });
});

test("the withdrawal function stays unconfigured unless all four variables are set", () => {
  assert.equal(withdrawalMailConfig(parseServerEnv({})), null);
  for (const key of Object.keys(graphEnv)) {
    const env = parseServerEnv({ ...graphEnv, [key]: "" });
    assert.equal(withdrawalMailConfig(env), null, `${key} empty`);
  }
});

test("a malformed withdrawal mail variable stops the server without showing its value", () => {
  for (const [key, value] of [
    ["GRAPH_TENANT_ID", "contoso.onmicrosoft.com"],
    ["GRAPH_CLIENT_ID", "not-a-guid"],
    ["GRAPH_CLIENT_SECRET", "has whitespace"],
    ["WITHDRAWAL_MAILBOX", "no-address"],
  ] as const) {
    assert.throws(
      () => parseServerEnv({ ...graphEnv, [key]: value }),
      (error: unknown) => {
        assert.ok(error instanceof EnvError);
        assert.match(
          error.message,
          new RegExp(`^${key} is set but malformed: `),
        );
        assert.ok(!error.message.includes(value));
        return true;
      },
    );
  }
});

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
