import { defineConfig, devices } from "@playwright/test";

const port = 3101;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Runs the production build the way the Docker image does: the standalone server, after the copy step of the
  // Dockerfile's runner stage (scripts/prepare-standalone.mjs).
  webServer: {
    command:
      "node ../../scripts/prepare-standalone.mjs && node .next/standalone/apps/portal/server.js",
    // Set explicitly: the server binds to HOSTNAME, which a shell may hold as the machine name.
    env: { PORT: String(port), HOSTNAME: "127.0.0.1" },
    url: `http://127.0.0.1:${port}/health`,
    // Never reuse a server already listening on the port: it could belong to another
    // worktree's build and would give a false green against the wrong code.
    reuseExistingServer: false,
  },
});
