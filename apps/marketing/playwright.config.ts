import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const skillforgePort = 3199;

/** The app's connection to the SkillForge stub: its synthetic client, which no real SkillForge knows. */
const skillforge = {
  SKILLFORGE_API_URL: `http://127.0.0.1:${skillforgePort}`,
  SKILLFORGE_CLIENT_ID: "marketing-e2e",
  SKILLFORGE_CLIENT_SECRET: "sf_synthetic_secret",
};

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // The safety net under `isolate`: a non-local request that slips past every route (one that follows a redirect,
    // say) fails to resolve instead of leaving the machine.
    launchOptions: {
      args: [
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    // A local SkillForge with synthetic invoices (e2e/stubs/skillforge.mjs) for the payment page.
    {
      command: `node e2e/stubs/skillforge.mjs ${skillforgePort}`,
      url: `${skillforge.SKILLFORGE_API_URL}/health`,
      reuseExistingServer: false,
    },
    // Runs the production build the way the Docker image does: the standalone server, after the copy step of the
    // Dockerfile's runner stage (scripts/prepare-standalone.mjs).
    {
      command:
        "node ../../scripts/prepare-standalone.mjs && node .next/standalone/apps/marketing/server.js",
      // Set explicitly: the server binds to HOSTNAME, which a shell may hold as the machine name. The SkillForge
      // connection is the stub's, also explicitly: Next never overrides a variable that is set, so neither the shell
      // nor an env file under apps/marketing can point a test run at a real SkillForge.
      env: { PORT: String(port), HOSTNAME: "127.0.0.1", ...skillforge },
      url: `http://127.0.0.1:${port}/health`,
      // Never reuse a server already listening on the port: it could belong to another
      // worktree's build and would give a false green against the wrong code.
      reuseExistingServer: false,
    },
  ],
});
