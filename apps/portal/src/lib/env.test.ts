import assert from "node:assert/strict";
import { test } from "vitest";

import { parseServerEnv } from "@/lib/env";

test("variables the portal does not read never reach its environment", () => {
  assert.deepEqual(
    parseServerEnv({ CAL_API_KEY: "cal_live_test123", PATH: "/bin" }),
    {},
  );
});
