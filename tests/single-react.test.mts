/**
 * The workspace resolves one React. `@skillsite/ui` is consumed from source, so a second copy breaks its hooks in
 * the app's component tests and loads a second icon package. `pnpm-workspace.yaml` overrides `react` and
 * `react-dom` to the app's version for that reason; these tests read the override, the app's manifest and the
 * lockfile.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { test } from "vitest";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const overrides = (
  load(read("pnpm-workspace.yaml")) as { overrides: Record<string, string> }
).overrides;
const appDependencies = (
  JSON.parse(read("apps/marketing/package.json")) as {
    dependencies: Record<string, string>;
  }
).dependencies;

/** The versions the lockfile resolves for a package (its last document's `packages:` section). */
function lockedVersions(name: string): string[] {
  const lock = read("pnpm-lock.yaml");
  const start = lock.lastIndexOf("\npackages:\n");
  const section = lock.slice(start, lock.indexOf("\nsnapshots:\n", start));
  return [
    ...section.matchAll(new RegExp(`^  '?${name}@(\\d[^:']*)'?:$`, "gm")),
  ].map((match) => match[1]);
}

for (const name of ["react", "react-dom"]) {
  test(`the workspace overrides ${name} to the app's version`, () => {
    assert.ok(appDependencies[name], `apps/marketing depends on ${name}`);
    assert.equal(String(overrides[name]), appDependencies[name]);
  });

  test(`the lockfile resolves one ${name}`, () => {
    assert.deepEqual(lockedVersions(name), [appDependencies[name]]);
  });
}
