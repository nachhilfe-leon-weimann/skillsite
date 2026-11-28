import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

// Logic tests only for now; a `components` project (jsdom) joins with the first component test.
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
    include: ["src/**/*.test.{ts,mts}"],
    // Keep Vitest's own default excludes (node_modules, .next, ...); only add e2e/.
    exclude: [...configDefaults.exclude, "e2e/**"],
    environment: "node",
    restoreMocks: true,
  },
});
