/**
 * Turbo runs tasks in strict env mode and drops every variable turbo.json does not declare. `CAL_API_KEY= just dev`
 * (also `build`, `smoke`) must reach Next as an empty value: Next never overrides a variable that is set, so the
 * booking reports `unconfigured` instead of loading the real key from `apps/marketing/.env`.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const turbo = JSON.parse(
  readFileSync(path.join(root, "turbo.json"), "utf8"),
) as {
  envMode?: string;
  globalPassThroughEnv?: string[];
};

test("turbo passes CAL_API_KEY through to every task", () => {
  assert.ok(
    turbo.envMode === "loose" ||
      turbo.globalPassThroughEnv?.includes("CAL_API_KEY"),
    "turbo.json must list CAL_API_KEY in globalPassThroughEnv",
  );
});

// The same for the withdrawal mail: `WITHDRAWAL_MAILBOX= just dev` keeps the function unconfigured, so no
// agent session sends a real e-mail through Microsoft Graph even when an env file holds the credentials.
test.each([
  "GRAPH_TENANT_ID",
  "GRAPH_CLIENT_ID",
  "GRAPH_CLIENT_SECRET",
  "WITHDRAWAL_MAILBOX",
])("turbo passes %s through to every task", (name) => {
  assert.ok(
    turbo.envMode === "loose" || turbo.globalPassThroughEnv?.includes(name),
    `turbo.json must list ${name} in globalPassThroughEnv`,
  );
});
