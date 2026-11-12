/**
 * ci.yml scopes pull requests to the checks their changed areas need; the ruleset requires the job `check`.
 *
 * A required check that is skipped or never created blocks every merge, and a filter that maps a file to the
 * wrong area lets a broken change through. These tests read the workflow and evaluate its path filter the way
 * dorny/paths-filter does (picomatch with `dot: true`), so a slip turns `check` red.
 */
import assert from "node:assert/strict";
import { globSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import picomatch from "picomatch";
import { test } from "vitest";

type Step = {
  name?: string;
  id?: string;
  if?: string;
  run?: string;
  env?: Record<string, string>;
  uses?: string;
  "continue-on-error"?: boolean;
  with?: Record<string, string>;
};
type Job = {
  name?: string;
  if?: string;
  env?: Record<string, string>;
  needs?: string | string[];
  outputs?: Record<string, string>;
  strategy?: { matrix?: Record<string, unknown> };
  steps: Step[];
};
type Workflow = { on: Record<string, unknown>; jobs: Record<string, Job> };

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const workflow = load(read(".github/workflows/ci.yml")) as Workflow;
const { changes, suite, check, "docker-build": dockerBuild } = workflow.jobs;
const filterStep = changes.steps.find((step) => step.id === "filter")!;

type Area = "website" | "portal" | "ui" | "shared" | "docker";
const filters = load(filterStep.with!.filters) as Record<Area, string[]>;

/**
 * The areas a change set touches, as dorny/paths-filter decides them with `some-with-excludes`: a file belongs
 * to an area when one of its patterns matches and none of its `!` patterns does.
 */
function areas(files: string[]): Area[] {
  assert.equal(filterStep.with!["predicate-quantifier"], "some-with-excludes");
  const matcher = (patterns: string[]) =>
    patterns.length > 0 ? picomatch(patterns, { dot: true }) : () => false;
  return (Object.keys(filters) as Area[]).filter((area) => {
    const includes = filters[area].filter((p) => !p.startsWith("!"));
    const excludes = filters[area]
      .filter((p) => p.startsWith("!"))
      .map((p) => p.slice(1));
    const included = matcher(includes);
    const excluded = matcher(excludes);
    return files.some((file) => included(file) && !excluded(file));
  });
}

const needs = (job: Job) => [job.needs ?? []].flat();

test("the job `check` reports on every pull request", () => {
  // A path filter on the trigger would skip the whole run, and a required check that never starts blocks merging.
  assert.equal(workflow.on.pull_request, null);
  assert.ok(check.name === undefined || check.name === "check");
  assert.equal(check.if, "always()");
  assert.deepEqual(
    needs(check).sort(),
    Object.keys(workflow.jobs)
      .filter((id) => id !== "check")
      .sort(),
  );
});

test("`check` fails when a needed job failed or was cancelled", () => {
  const [step] = check.steps;
  const script = step.run ?? "";

  assert.equal(check.steps.length, 1);
  assert.equal(step.env?.RESULTS, "${{ join(needs.*.result, ' ') }}");
  assert.match(script, /failure/);
  assert.match(script, /cancelled/);
  assert.doesNotMatch(script, /skipped/);
});

test("a docs-only change runs the format check and cannot skip `check`", () => {
  assert.deepEqual(
    areas(["docs/specs/foundation-refactor.md", "AGENTS.md", "docs/a.png"]),
    [],
  );
  // The job holding the format check has no condition of its own; only its area steps do.
  assert.equal(suite.if, undefined);
  assert.equal(
    suite.steps.find((step) => step.run === "just format-check")?.if,
    "env.FULL != 'true'",
  );
});

test.each([
  ["website code", ["apps/marketing/src/app/page.tsx"], ["website", "docker"]],
  [
    "website tests",
    [
      "apps/marketing/e2e/smoke.spec.ts",
      "apps/marketing/src/lib/routes.test.ts",
    ],
    ["website"],
  ],
  [
    "portal code",
    ["apps/portal/src/proxy.ts", "apps/portal/public/logo-icon.png"],
    ["portal", "docker"],
  ],
  [
    "portal tests",
    ["apps/portal/e2e/smoke.spec.ts", "apps/portal/src/proxy.test.ts"],
    ["portal"],
  ],
  [
    "API client code and contract",
    [
      "packages/api-client/src/index.ts",
      "packages/api-client/contracts/openapi.json",
    ],
    ["portal", "docker"],
  ],
  ["API client tests", ["packages/api-client/src/schema.test.ts"], ["portal"]],
  [
    "UI package code",
    ["packages/ui/src/primitives/button.tsx"],
    ["ui", "docker"],
  ],
  [
    "UI stories and Storybook",
    [
      "packages/ui/src/primitives/button.stories.tsx",
      "packages/ui/.storybook/preview.tsx",
    ],
    ["ui"],
  ],
  ["the lockfile", ["pnpm-lock.yaml"], ["shared", "docker"]],
  [
    "the shared config",
    ["packages/config/eslint/next.mjs"],
    ["shared", "docker"],
  ],
  ["a pnpm patch", ["patches/x.patch"], ["shared", "docker"]],
  ["the Dockerfile", ["Dockerfile"], ["shared", "docker"]],
  ["the CI workflow", [".github/workflows/ci.yml"], ["shared", "docker"]],
  [
    "root tooling",
    ["justfile", "tests/a.test.mts", "scripts/a.mjs", "prettier.config.mjs"],
    ["shared"],
  ],
  ["a new root file", ["compose.yml"], ["shared"]],
  [
    "website and docs",
    ["apps/marketing/src/content/home.ts", "docs/specs/a.md"],
    ["website", "docker"],
  ],
])("%s maps to its areas", (_, files, expected) => {
  assert.deepEqual(areas(files), expected);
});

test("a full run covers the release PR, manual runs, shared changes and a failed filter", () => {
  // The filter runs only on an ordinary pull request; skipped or failed, its outcome is not `success`.
  assert.equal(
    filterStep.if,
    "github.event_name == 'pull_request' && !startsWith(github.head_ref, 'release-please--')",
  );
  assert.equal(filterStep["continue-on-error"], true);
  assert.equal(
    changes.outputs!.full,
    "${{ steps.filter.outcome != 'success' || steps.filter.outputs.shared == 'true' }}",
  );
  assert.equal(
    changes.outputs!.docker,
    "${{ steps.filter.outcome != 'success' || steps.filter.outputs.docker == 'true' }}",
  );
  assert.equal(
    changes.outputs!.repeat,
    "${{ github.event_name == 'workflow_dispatch' || startsWith(github.head_ref, 'release-please--') }}",
  );
});

test("a full run is the local suite, repeated on the release PR", () => {
  const run = (condition: string) =>
    suite.steps.find((step) => step.if === condition)?.run;

  assert.equal(run("env.FULL == 'true' && env.REPEAT != 'true'"), "just check");
  assert.equal(
    run("env.FULL == 'true' && env.REPEAT == 'true'"),
    "just check-repeat",
  );
  // Every other check step belongs to the scoped run.
  const scoped = suite.steps.filter(
    (step) =>
      step.run?.startsWith("just") || step.run?.startsWith("pnpm turbo"),
  );
  for (const step of scoped.filter((s) => !s.if?.startsWith("env.FULL =="))) {
    assert.ok(step.if?.startsWith("env.FULL != 'true'"), step.name);
  }
});

test("`just check-repeat` is `just check` with every browser test three times", () => {
  const recipe = (name: string) =>
    read("justfile").match(new RegExp(`^${name}:(.*)\\n((?: {4}.*\\n)*)`, "m"));
  const check = recipe("check")!;
  const repeat = recipe("check-repeat")!;

  assert.equal(check[1].trim(), "static-checks test build smoke widgets");
  assert.equal(repeat[1].trim(), "static-checks test build");
  assert.deepEqual(
    repeat[2]
      .trim()
      .split("\n")
      .map((line) => line.trim()),
    [
      "pnpm --filter @skillsite/marketing e2e --repeat-each=3",
      "pnpm --filter @skillsite/portal e2e --repeat-each=3",
      "pnpm --filter @skillsite/ui widgets --repeat-each=3",
    ],
  );
});

test.each([
  ["website", "WEBSITE", "marketing"],
  ["portal", "PORTAL", "portal"],
])(
  "a change to the %s runs its checks; a UI change builds and smoke-tests it too",
  (area, env, app) => {
    const runs = (flag: string) =>
      suite.steps
        .filter((step) => step.if?.includes(`env.${flag} == 'true'`))
        .map((step) => step.run);

    assert.equal(
      changes.outputs![area],
      `\${{ steps.filter.outputs.${area} == 'true' }}`,
    );
    assert.equal(suite.env![env], `\${{ needs.changes.outputs.${area} }}`);
    assert.ok(
      runs(env).includes(`pnpm turbo run lint test --filter=@skillsite/${app}`),
    );
    assert.ok(
      runs(env).includes(`pnpm turbo run e2e --filter=@skillsite/${app}`),
    );
    assert.ok(
      runs("UI").includes(`pnpm turbo run e2e --filter=@skillsite/${app}`),
    );
  },
);

test("a change to the portal or the API client lints, type-checks and unit-tests the API client", () => {
  const step = suite.steps.find(
    (s) =>
      s.run ===
      "pnpm turbo run lint typecheck test --filter=@skillsite/api-client",
  );

  assert.equal(step?.if, "env.FULL != 'true' && env.PORTAL == 'true'");
});

test("a change to image inputs builds the image of every app", () => {
  const apps = readdirSync(path.join(root, "apps"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const build = dockerBuild.steps.find((step) =>
    step.uses?.startsWith("docker/build-push-action@"),
  )!;

  assert.deepEqual([dockerBuild.strategy?.matrix?.app].flat().sort(), apps);
  assert.equal(build.with!["build-args"], "APP=${{ matrix.app }}");
  for (const app of apps) {
    assert.ok(
      areas([`apps/${app}/src/app/layout.tsx`]).includes("docker"),
      app,
    );
  }
});

test("the runtime image holds only build output, so tests and stories stay out of it", () => {
  // The Docker filter ignores tests, e2e, stories and Storybook config on that basis.
  const runner = read("Dockerfile").split(/^FROM .* AS runner$/m)[1];
  const copies = runner.match(/^COPY .*$/gm) ?? [];

  assert.ok(copies.length > 0);
  for (const copy of copies) {
    assert.match(
      copy,
      /^COPY --from=build \S+ \/app\/apps\/\$\{APP\}\/(\.next\/standalone|\.next\/static|public) /,
    );
  }
});

test("every action is pinned to a commit SHA with its version", () => {
  const uses = read(".github/workflows/ci.yml").match(/^\s+uses: .*$/gm) ?? [];

  assert.ok(uses.length > 0);
  for (const line of uses) {
    assert.match(line, /uses: [\w-]+\/[\w-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
  }
});

test("the browser comes from a cache keyed on the Playwright version, without apt", () => {
  const at = [
    "Resolve the Playwright version",
    "Cache the Playwright browser",
    "Install the Playwright browser",
  ].map((name) => suite.steps.findIndex((step) => step.name === name));
  const [version, cache, install] = at.map((i) => suite.steps[i]);

  assert.ok(at[0] >= 0);
  assert.deepEqual(at, [at[0], at[0] + 1, at[0] + 2]);
  assert.equal(new Set([version.if, cache.if, install.if]).size, 1);
  assert.match(version.run!, /playwright --version/);
  assert.match(cache.uses!, /^actions\/cache@/);
  assert.equal(cache.with!.path, "~/.cache/ms-playwright");
  assert.match(
    cache.with!.key,
    /\$\{\{ steps\.playwright\.outputs\.version \}\}/,
  );

  // The headless shell, no `--with-deps`; apt only when Chromium cannot launch.
  const script = install.run!;
  assert.match(script, /playwright install --only-shell chromium/);
  assert.doesNotMatch(script, /--with-deps/);
  assert.match(
    script,
    /if ! .*chromium\.launch\(\).*; then\n(?:.*\n)*?\s+.*playwright install-deps chromium\n\s*fi/,
  );
});

test("every browser suite runs headless on one Playwright version", () => {
  // The cache holds one version's headless shell: a second version or a headed launch would miss it.
  // The lockfile lists a package under `packages:` and `snapshots:`.
  const locked = read("pnpm-lock.yaml").match(/^ {2}playwright@[\d.]+:$/gm);
  assert.equal(new Set(locked).size, 1);
  const sources = globSync(
    [
      "{apps/marketing,apps/portal,packages/ui}/playwright.config.ts",
      "{apps/marketing,apps/portal,packages/ui}/e2e/**/*.ts",
    ],
    { cwd: root },
  );
  assert.ok(sources.length > 2);
  for (const file of sources) {
    assert.doesNotMatch(read(file), /headless|channel:/, file);
  }
});
