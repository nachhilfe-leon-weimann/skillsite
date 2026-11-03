import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.mts", "scripts/**/*.test.mjs"],
    environment: "node",
    restoreMocks: true,
  },
});
