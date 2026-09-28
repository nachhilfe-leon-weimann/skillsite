import { globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const { exports } = JSON.parse(
  readFileSync(`${packageRoot}/package.json`, "utf8"),
) as { exports: Record<string, string> };
const require = createRequire(import.meta.url);

/** The public API: every module of src/ that is neither a story nor a test. */
const modules = globSync("src/**/*.{ts,tsx}", { cwd: packageRoot })
  .filter((file) => !/\.(stories|test)\.tsx?$/.test(file))
  .map((file) => `./${file}`)
  .sort();

/** Module exports: everything but the stylesheet folder. */
const moduleExports = Object.entries(exports).filter(
  ([subpath]) => subpath !== "./styles/*",
);

test("every module is exported, and only modules are", () => {
  expect(moduleExports.map(([, target]) => target).sort()).toEqual(modules);
});

test("each export path names its group and file", () => {
  for (const [subpath, target] of moduleExports) {
    expect(target.replace(/\.tsx?$/, ""), subpath).toBe(
      `./src/${subpath.slice(2)}`,
    );
  }
});

test("an exported module resolves", () => {
  expect(require.resolve("@skillsite/ui/primitives/button")).toMatch(
    /src\/primitives\/button\.tsx$/,
  );
});

test("stories, tests and ungrouped paths do not resolve", () => {
  for (const specifier of [
    "@skillsite/ui/primitives/button.stories",
    "@skillsite/ui/primitives/button.test",
    "@skillsite/ui/button",
    "@skillsite/ui/src/primitives/button.tsx",
  ]) {
    expect(() => require.resolve(specifier), specifier).toThrow(
      /not defined by "exports"/,
    );
  }
});
