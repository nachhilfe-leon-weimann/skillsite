import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

const ui = JSON.parse(
  readFileSync(
    new URL("../../packages/ui/package.json", import.meta.url),
    "utf8",
  ),
) as {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

/*
 * `@skillsite/ui` is consumed from source. The workspace resolves its peers
 * (React, Next) to other copies than the app's, and two Reacts break every hook;
 * the Next build bundles one. So the package's peers resolve to the app's
 * copies here (`dedupe`), and the React libraries it pulls in are inlined, so
 * that their React imports take the same route.
 */
const uiReactLibraries = [
  ...Object.keys(ui.dependencies),
  /@radix-ui\//,
  /@floating-ui\/react-dom/,
];

export default defineConfig({
  resolve: {
    // Resolve the `@/` alias of tsconfig.json, like the Next build does.
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./vitest.server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,mts}"],
          // Keep Vitest's own default excludes (node_modules, .next, ...); only add e2e/.
          exclude: [...configDefaults.exclude, "e2e/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        resolve: { dedupe: Object.keys(ui.peerDependencies) },
        test: {
          name: "components",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          server: { deps: { inline: uiReactLibraries } },
        },
      },
    ],
    restoreMocks: true,
  },
});
