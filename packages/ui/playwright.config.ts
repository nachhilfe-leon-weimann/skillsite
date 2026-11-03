import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:6106";

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, locale: "de-DE", timezoneId: "Europe/Berlin" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node e2e/serve-storybook.ts",
    url: `${baseURL}/iframe.html`,
    // A listener here might serve another checkout. Always own this process.
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
});
