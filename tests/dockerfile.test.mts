/**
 * The Dockerfile prunes the workspace with `pnpm dlx turbo@<version>`. Dependabot does not update that pin,
 * so it drifts from the workspace's turbo; this test turns the drift into a red `check`.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

test("the Dockerfile prunes with the workspace's turbo version", () => {
  const pinned = read("Dockerfile").match(/turbo@(\d+\.\d+\.\d+)/)?.[1];
  const locked = read("pnpm-lock.yaml").match(
    /^ {2}turbo@(\d+\.\d+\.\d+):$/m,
  )?.[1];
  assert.ok(locked, "turbo is missing from pnpm-lock.yaml");
  assert.equal(pinned, locked);
});
