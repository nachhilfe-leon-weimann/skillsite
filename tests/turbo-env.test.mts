/**
 * Turbo runs tasks in strict env mode and drops every variable turbo.json does not declare. `CAL_API_KEY= just dev`
 * (also `build`, `smoke`) must reach Next as an empty value: Next never overrides a variable that is set, so the
 * booking reports `unconfigured` instead of loading the real key from `apps/marketing/.env`.
 * The payment lookup's SkillForge connection works the same way:
 * `SKILLFORGE_API_URL= SKILLFORGE_CLIENT_ID= SKILLFORGE_CLIENT_SECRET= just dev` runs it unconfigured.
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

test.each([
  "CAL_API_KEY",
  "SKILLFORGE_API_URL",
  "SKILLFORGE_CLIENT_ID",
  "SKILLFORGE_CLIENT_SECRET",
])("turbo passes %s through to every task", (name) => {
  assert.ok(
    turbo.envMode === "loose" || turbo.globalPassThroughEnv?.includes(name),
    `turbo.json must list ${name} in globalPassThroughEnv`,
  );
});
