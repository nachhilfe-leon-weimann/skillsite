import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Runs against the production build; `next start` warns about `output: "standalone"` but serves it.
  webServer: {
    command: `pnpm start -p ${port}`,
    url: `http://127.0.0.1:${port}/health`,
    // Never reuse a server already listening on the port: it could belong to another
    // worktree's build and would give a false green against the wrong code.
    reuseExistingServer: false,
  },
});
