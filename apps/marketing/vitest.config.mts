import { defineConfig } from "vitest/config";

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
          environment: "node",
        },
      },
    ],
    restoreMocks: true,
  },
});
