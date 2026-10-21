import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      // Keep the marketing smoke suite's external-request isolation. Local asset
      // requests always reach the static server, including missing/broken assets.
      await page
        .context()
        .route(
          /^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/,
          (route) => route.fulfill({ status: 204, body: "" }),
        );
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) => {
        errors.push(`${request.url()}: ${request.failure()?.errorText}`);
      });
      page.on("response", (response) => {
        if (response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await use(errors);
      expect(errors, "Storybook browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
