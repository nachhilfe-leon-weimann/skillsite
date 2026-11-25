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

// Synthetic SkillForge client; never a real one.
const skillforge = {
  SKILLFORGE_API_URL: "http://skillforge.test",
  SKILLFORGE_CLIENT_ID: "marketing-e2e",
  SKILLFORGE_CLIENT_SECRET: "sf_synthetic_secret",
};

test("without the SkillForge variables the payment lookup stays unconfigured", () => {
  assert.deepEqual(
    parseServerEnv({
      SKILLFORGE_API_URL: "",
      SKILLFORGE_CLIENT_ID: "",
      SKILLFORGE_CLIENT_SECRET: "",
    }),
    {},
  );
});

test("all three SkillForge variables are kept, next to the Cal.com key", () => {
  assert.deepEqual(parseServerEnv(skillforge), skillforge);
  assert.deepEqual(
    parseServerEnv({ ...skillforge, CAL_API_KEY: "cal_live_test123" }),
    { CAL_API_KEY: "cal_live_test123", ...skillforge },
  );
  assert.deepEqual(
    parseServerEnv({
      ...skillforge,
      SKILLFORGE_API_URL: "https://skillforge.test/",
    }),
    { ...skillforge, SKILLFORGE_API_URL: "https://skillforge.test/" },
  );
});

test("part of the SkillForge variables stops the server, naming the missing ones", () => {
  assert.throws(
    () =>
      parseServerEnv({
        SKILLFORGE_API_URL: skillforge.SKILLFORGE_API_URL,
        SKILLFORGE_CLIENT_SECRET: skillforge.SKILLFORGE_CLIENT_SECRET,
      }),
    (error: unknown) => {
      assert.ok(error instanceof EnvError);
      assert.match(error.message, /^SKILLFORGE_CLIENT_ID missing: /);
      assert.ok(!error.message.includes("sf_synthetic_secret"));
      return true;
    },
  );
  assert.throws(
    () => parseServerEnv({ SKILLFORGE_CLIENT_ID: "marketing-e2e" }),
    /^EnvError: SKILLFORGE_API_URL, SKILLFORGE_CLIENT_SECRET missing: /,
  );
});

test("a SkillForge URL with a path stops the server", () => {
  for (const url of [
    "http://skillforge.test/api/v1",
    "http://skillforge.test/?x=1",
    "skillforge.test",
    "ftp://skillforge.test",
  ]) {
    assert.throws(
      () => parseServerEnv({ ...skillforge, SKILLFORGE_API_URL: url }),
      (error: unknown) => {
        assert.ok(error instanceof EnvError);
        assert.match(
          error.message,
          /^SKILLFORGE_API_URL is set but malformed: .*without a path/,
        );
        return true;
      },
    );
  }
});

test("a malformed SkillForge secret stops the server with a message that never shows it", () => {
  const secret = "sf_synthetic secret";
  assert.throws(
    () => parseServerEnv({ ...skillforge, SKILLFORGE_CLIENT_SECRET: secret }),
    (error: unknown) => {
      assert.ok(error instanceof EnvError);
      assert.match(
        error.message,
        /^SKILLFORGE_CLIENT_SECRET is set but malformed: /,
      );
      assert.ok(!error.message.includes(secret));
      assert.ok(!error.message.includes("sf_synthetic"));
      return true;
    },
  );
});
