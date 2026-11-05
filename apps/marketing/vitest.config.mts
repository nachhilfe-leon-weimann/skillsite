import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

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
    ],
    restoreMocks: true,
  },
});
