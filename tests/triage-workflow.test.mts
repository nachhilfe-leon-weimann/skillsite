/**
 * triage.yml runs with the org App's key for anyone who opens an issue or a PR.
 *
 * `issues` and `pull_request_target` execute the workflow from `main` with access to secrets, even
 * for an outsider. The work - and the rules that make it safe: no checkout, no event data in a
 * shell - lives in the platform's shared workflow, which guards them with its own tests
 * (`skill-platform-workflows`, `tests/test_workflows.py`). That only holds while this file stays a
 * caller (skillforge, `docs/specs/project-intake.md`, platform contract). These tests turn a slip
 * into a red `check`.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = path.join(root, ".github", "workflows", "triage.yml");
const sharedWorkflow =
  "Nachhilfe-Leon-Weimann/skill-platform-workflows/.github/workflows/triage.yml@v1";

function lines(): string[] {
  return readFileSync(workflow, "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"));
}

test("the workflow only calls the shared workflow", () => {
  assert.deepEqual(
    lines()
      .filter((line) => line.trimStart().startsWith("uses:"))
      .map((line) => line.trim()),
    [`uses: ${sharedWorkflow}`],
  );
});

test("the workflow has no steps of its own", () => {
  // A job with steps would run them from `main` with the App key, on anybody's issue or PR.
  const keys = lines().map((line) => line.trim().replace(/^- /, ""));

  assert.deepEqual(
    keys.filter((key) =>
      ["steps:", "runs-on:", "run:"].some((k) => key.startsWith(k)),
    ),
    [],
  );
});

test("the default token has no permissions", () => {
  assert.ok(lines().includes("permissions: {}"));
});

test("the call grants only what the assignment and the reminder need", () => {
  const all = lines();
  const granted: string[] = [];
  for (const line of all.slice(all.indexOf("    permissions:") + 1)) {
    if (!line.startsWith("      ")) break;
    granted.push(line.trim());
  }

  assert.deepEqual(granted, ["issues: write", "pull-requests: write"]);
});
