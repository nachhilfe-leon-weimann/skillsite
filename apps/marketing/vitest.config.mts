import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the `@/` alias of tsconfig.json, like the Next build does.
  resolve: { tsconfigPaths: true },
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
