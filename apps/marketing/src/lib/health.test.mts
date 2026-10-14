import assert from "node:assert/strict";
import { test } from "vitest";

// The build-time version is read once, when the module is first evaluated -
// hence the import after the environment is set.
process.env.APP_VERSION = "9.9.9";
const { healthReport } = await import("./health.ts");

test("the report is the shape the deploy waits for", () => {
  // The deploy polls until `.status == "ok" and .version == <released version>`;
  // any other shape makes it time out and fail the release.
  assert.deepEqual(healthReport("1.1.7"), { status: "ok", version: "1.1.7" });
});

test("the version is the one baked into the image", () => {
  assert.deepEqual(healthReport(), { status: "ok", version: "9.9.9" });
});
