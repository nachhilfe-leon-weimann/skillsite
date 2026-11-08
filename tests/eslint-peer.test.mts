/**
 * `@skillsite/config` ships the ESLint presets and declares ESLint as a peer; every workspace package that lints
 * brings its own ESLint. A peer range that misses that ESLint makes pnpm resolve the presets and their plugins
 * against a second, older ESLint. These tests read the manifests and the lockfile.
 */
import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

type Manifest = {
  name: string;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const manifest = (file: string) => JSON.parse(read(file)) as Manifest;

/** The majors a range like `^10` or `^9 || ^10` admits. */
const majors = (range: string) =>
  range.split("||").map((part) => {
    const major = part.trim().match(/^\^(\d+)(\.|$)/)?.[1];
    assert.ok(major, `"${range}" is not a caret range`);
    return Number(major);
  });

const peerRange = manifest("packages/config/package.json").peerDependencies
  ?.eslint;
const linting = globSync(["apps/*/package.json", "packages/*/package.json"], {
  cwd: root,
})
  .map(manifest)
  .filter((pkg) => pkg.devDependencies?.eslint);

/** The versions the lockfile resolves for a package (its last document's `packages:` section). */
function lockedVersions(name: string): string[] {
  const lock = read("pnpm-lock.yaml");
  const start = lock.lastIndexOf("\npackages:\n");
  const section = lock.slice(start, lock.indexOf("\nsnapshots:\n", start));
  return [
    ...section.matchAll(new RegExp(`^  '?${name}@(\\d[^:']*)'?:$`, "gm")),
  ].map((match) => match[1]);
}

test("the presets' ESLint peer admits the ESLint every package lints with", () => {
  assert.ok(peerRange, "@skillsite/config declares an eslint peer");
  assert.ok(linting.length > 0, "some workspace package lints");
  for (const pkg of linting) {
    const [major] = majors(pkg.devDependencies!.eslint);
    assert.ok(
      majors(peerRange).includes(major),
      `${pkg.name} lints with ESLint ${major}, the presets' peer is "${peerRange}"`,
    );
  }
});

test("the lockfile resolves one ESLint", () => {
  const versions = lockedVersions("eslint");
  assert.equal(versions.length, 1, `eslint resolves to ${versions.join(", ")}`);
  assert.ok(majors(peerRange!).includes(Number(versions[0].split(".")[0])));
});
