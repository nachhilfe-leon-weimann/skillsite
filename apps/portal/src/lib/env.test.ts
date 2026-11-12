import assert from "node:assert/strict";
import { test } from "vitest";

import { EnvError, parseServerEnv } from "@/lib/env";

const skillforge = {
  SKILLFORGE_API_URL: "http://localhost:8000",
  SKILLFORGE_CLIENT_ID: "portal",
  SKILLFORGE_CLIENT_SECRET: "sf_live_synthetic",
};

test("variables the portal does not read never reach its environment", () => {
  assert.deepEqual(
    parseServerEnv({ CAL_API_KEY: "cal_live_test123", PATH: "/bin" }),
    {},
  );
});

test("without the SkillForge variables the portal runs unconfigured", () => {
  assert.deepEqual(parseServerEnv({}), {});
  assert.deepEqual(
    parseServerEnv({
      SKILLFORGE_API_URL: "",
      SKILLFORGE_CLIENT_ID: "",
      SKILLFORGE_CLIENT_SECRET: "",
    }),
    {},
  );
});

test("all three SkillForge variables configure the connection", () => {
  assert.deepEqual(parseServerEnv(skillforge), skillforge);
});

test("part of the SkillForge variables stops the server, naming the missing ones", () => {
  assert.throws(
    () =>
      parseServerEnv({
        SKILLFORGE_API_URL: skillforge.SKILLFORGE_API_URL,
        SKILLFORGE_CLIENT_ID: skillforge.SKILLFORGE_CLIENT_ID,
      }),
    (error) =>
      error instanceof EnvError &&
      error.message.startsWith("SKILLFORGE_CLIENT_SECRET missing"),
  );
});

test.each([
  ["SKILLFORGE_API_URL", "ftp://skillforge.test"],
  ["SKILLFORGE_API_URL", "http://localhost:8000/api/v1"],
  ["SKILLFORGE_CLIENT_ID", "por tal"],
  ["SKILLFORGE_CLIENT_SECRET", "sf_live_synthetic\n"],
])(
  "a malformed %s stops the server without echoing the value",
  (name, value) => {
    assert.throws(
      () => parseServerEnv({ ...skillforge, [name]: value }),
      (error) =>
        error instanceof EnvError &&
        error.message.startsWith(`${name} is set but malformed`) &&
        !error.message.includes(value.trim()),
    );
  },
);
