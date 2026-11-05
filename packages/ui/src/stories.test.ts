import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const { exports } = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
) as { exports: Record<string, string> };

/** The groups whose modules hold components; hooks, utils and tokens hold none. */
const COMPONENT_GROUPS = [
  "primitives",
  "typography",
  "forms",
  "overlays",
  "layout",
  "motion",
  "shell",
];

/**
 * A module whose components are shown in another module's story file: the
 * provider has no look of its own and is shown around the toggle it serves.
 */
const STORIED_ELSEWHERE: Record<string, string> = {
  "src/shell/theme-provider.tsx": "src/shell/theme-toggle.stories.tsx",
};

const read = (file: string) => readFileSync(join(packageRoot, file), "utf8");

/** Every exported `.tsx` module of a component group, as `src/<group>/<name>.tsx`. */
const componentModules = Object.values(exports)
  .map((target) => normalize(target))
  .filter((file) => {
    const [src, group] = file.split("/");
    return src === "src" && COMPONENT_GROUPS.includes(group ?? "");
  })
  .filter((file) => file.endsWith(".tsx"))
  .sort();

/** The components a module exports: its capitalised functions and constants. */
function exportedComponents(source: string) {
  return [...source.matchAll(/^export (?:function|const) ([A-Z]\w*)/gm)].map(
    (match) => match[1] ?? "",
  );
}

/** `src/<group>/<name>.tsx#Component` for every value a story file imports from the package. */
function storyImports(storyFile: string) {
  const imports = new Set<string>();
  const source = read(storyFile);
  for (const [, names = "", specifier = ""] of source.matchAll(
    /^import (?!type )\{([^}]*)\} from "(\.{1,2}\/[^"]+)";/gm,
  )) {
    const imported = `${normalize(join(dirname(storyFile), specifier))}.tsx`;
    for (const entry of names.split(",")) {
      const name = entry.trim().split(/\s+as\s+/)[0] ?? "";
      if (name && !name.startsWith("type ")) imports.add(`${imported}#${name}`);
    }
  }
  return imports;
}

/** The story file of a module: the one next to it, `<name>.stories.tsx`. */
const storyFileOf = (modulePath: string) =>
  STORIED_ELSEWHERE[modulePath] ?? modulePath.replace(/\.tsx$/, ".stories.tsx");

const components = componentModules.flatMap((modulePath) =>
  exportedComponents(read(modulePath)).map((name) => ({
    component: `${modulePath}#${name}`,
    storyFile: storyFileOf(modulePath),
  })),
);

test("the guard sees the components of every exported module", () => {
  const names = components.map(({ component }) => component);
  expect(componentModules.length).toBeGreaterThan(30);
  expect(names).toContain("src/primitives/button.tsx#Button");
  expect(names).toContain("src/overlays/popover.tsx#PopoverContent");
  expect(names).not.toContain("src/forms/select.tsx#SelectOption");
});

test("every exported component appears in the story file next to its module", () => {
  const missing = components
    .filter(
      ({ component, storyFile }) =>
        !existsSync(join(packageRoot, storyFile)) ||
        !storyImports(storyFile).has(component),
    )
    .map(({ component, storyFile }) => `${component} (${storyFile})`);
  expect(missing).toEqual([]);
});
