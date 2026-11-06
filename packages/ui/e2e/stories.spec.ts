import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";

type IndexEntry = { type: string; id: string; title: string; name: string };

// The built Storybook's own index: every story the workbench shows.
const index = JSON.parse(
  readFileSync(
    new URL("../storybook-static/index.json", import.meta.url),
    "utf8",
  ),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === "story",
);

test("the workbench has stories", () => {
  expect(stories.length).toBeGreaterThan(0);
});

// One pass per story: whether a story throws does not depend on the theme. The
// fixture fails the test on any console error, page error or failed request.
for (const story of stories) {
  test(`${story.title}: ${story.name} renders without errors`, async ({
    page,
  }) => {
    const response = await page.goto(
      `/iframe.html?id=${story.id}&viewMode=story`,
    );
    expect(response?.status()).toBe(200);
    // Storybook shows either the rendered story or its error display.
    const body = page.locator("body");
    await expect(body).toHaveClass(/sb-show-(main|errordisplay)/);
    await page.waitForLoadState("networkidle");
    await expect(body).toHaveClass(/sb-show-main/);
    await expect(body).not.toHaveClass(/sb-show-errordisplay/);
    await expect(page.locator("#storybook-root > *").first()).toBeAttached();
  });
}
