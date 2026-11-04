import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test";

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

/** Resolves once every animation and transition in the document has ended. */
export const animationsSettled = (page: Page) =>
  page.evaluate(async () => {
    await Promise.allSettled(
      document.getAnimations().map((animation) => animation.finished),
    );
  });

/** A visible keyboard focus ring: the element matches :focus-visible and draws an outline. */
export async function expectRing(element: Locator, what: string) {
  await expect(element).toBeFocused();
  expect(
    await element.evaluate((node) => node.matches(":focus-visible")),
    `${what}: focus-visible`,
  ).toBe(true);
  await expect(element, `${what}: outline`).not.toHaveCSS(
    "outline-style",
    "none",
  );
}

/** The scroll position once any (smooth) scroll has come to rest: two equal reads in a row. */
export async function settledScroll(page: Page) {
  let last = -1;
  await expect
    .poll(async () => {
      const now = await page.evaluate(() => scrollY);
      const settled = now === last;
      last = now;
      return settled;
    })
    .toBe(true);
  return last;
}

/**
 * Hold the open panel's exit where it begins: once it turns closed, its
 * transitions and presence animation pause, so the closing panel stays in the
 * page while the test acts. The returned function lets any held exit run on.
 */
export async function holdExit(page: Page) {
  const panel = page.locator("[data-radix-popper-content-wrapper] > *");
  await panel.evaluate((node) => {
    const observer = new MutationObserver(() => {
      if (node.getAttribute("data-state") !== "closed") return;
      observer.disconnect();
      for (const animation of node.getAnimations()) animation.pause();
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
  });
  return () =>
    panel.evaluate((node) => {
      for (const animation of node.getAnimations()) animation.play();
    });
}
