/**
 * The workspace resolves one React. `@skillsite/ui` is consumed from source, so a second copy breaks its hooks in
 * the app's component tests and loads a second icon package. `pnpm-workspace.yaml` overrides `react` and
 * `react-dom` to the apps' version for that reason; these tests read the override, the apps' manifests and the
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
/** Each app's runtime dependencies: every app pins the one React of the workspace. */
const apps = ["marketing", "portal"].map((app) => ({
  app,
  dependencies: (
    JSON.parse(read(`apps/${app}/package.json`)) as {
      dependencies: Record<string, string>;
    }
  ).dependencies,
}));
const appDependencies = apps[0]!.dependencies;

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
  test.each(apps)(
    `the workspace overrides ${name} to the $app app's version`,
    ({ app, dependencies }) => {
      assert.ok(dependencies[name], `apps/${app} depends on ${name}`);
      assert.equal(String(overrides[name]), dependencies[name]);
    },
  );

  test(`the lockfile resolves one ${name}`, () => {
    assert.deepEqual(lockedVersions(name), [appDependencies[name]]);
  });
}
