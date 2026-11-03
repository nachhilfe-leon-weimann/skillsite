/**
 * compose.yml pins the deployed image version and release-please keeps the pin current.
 *
 * release-please's generic updater rewrites the first semver on every line annotated with
 * `x-release-please-version`. A line that lost the annotation, or a file missing from
 * `extra-files`, is a silent no-op: the release would deploy the previous image. These tests
 * turn that into a red `check`.
 *
 * They deliberately do not compare the pin with the version in package.json - a rollback pins an
 * older one on purpose.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";

type ExtraFile = { type: string; path: string; jsonpath?: string };

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const pinnedImageLine =
  /^\s+image: ghcr\.io\/nachhilfe-leon-weimann\/skillsite:v(?<version>\d+\.\d+\.\d+) # x-release-please-version$/;

function imageLines(): string[] {
  return readFileSync(path.join(root, "compose.yml"), "utf8")
    .split("\n")
    .filter((line) => line.trimStart().startsWith("image:"));
}

function extraFiles(): ExtraFile[] {
  const config = JSON.parse(
    readFileSync(path.join(root, "release-please-config.json"), "utf8"),
  );
  return config.packages["."]["extra-files"];
}

test("every image line is pinned and annotated", () => {
  const lines = imageLines();

  assert.ok(lines.length > 0);
  assert.deepEqual(
    lines.filter((line) => !pinnedImageLine.test(line)),
    [],
  );
});

test("every service runs the same version", () => {
  const versions = new Set(
    imageLines().map((line) => pinnedImageLine.exec(line)?.groups?.version),
  );

  assert.equal(versions.size, 1);
});

test("release-please rewrites compose.yml", () => {
  assert.deepEqual(
    extraFiles().find((entry) => entry.path === "compose.yml"),
    { type: "generic", path: "compose.yml" },
  );
});
