import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const story = (name: string, theme = "light") =>
  `/iframe.html?id=forms-switch--${name}&viewMode=story&globals=theme:${theme}`;
const label = "Erinnerung per E-Mail";
const theSwitch = (page: Page) => page.getByRole("switch", { name: label });
const thumb = (page: Page) => theSwitch(page).locator("span");
const status = (page: Page) => page.getByRole("status");
const before = (page: Page) => page.getByRole("button", { name: "Davor" });
const after = (page: Page) => page.getByRole("button", { name: "Danach" });

/** A visible keyboard focus ring: the element matches :focus-visible and draws an outline. */
async function expectRing(element: Locator, surface: string) {
  await expect(element).toBeFocused();
  expect(
    await element.evaluate((node) => node.matches(":focus-visible")),
    `${surface}: focus-visible`,
  ).toBe(true);
  await expect(element, `${surface}: outline`).not.toHaveCSS(
    "outline-style",
    "none",
  );
}

/** The thumb's left edge inside the track, in CSS pixels. */
function thumbOffset(page: Page) {
  return theSwitch(page).evaluate(
    (track) =>
      track.firstElementChild!.getBoundingClientRect().left -
      track.getBoundingClientRect().left,
  );
}

test("named, keyboard toggles once, a visible ring", async ({ page }) => {
  await page.goto(story("default"));
  await expect(theSwitch(page)).toHaveAttribute("type", "button");
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "false");

  // One tab stop, with the ring on the unchecked and the checked track.
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expectRing(theSwitch(page), "light, unchecked");
  await page.keyboard.press("Space");
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  await expectRing(theSwitch(page), "light, checked");
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 1, Absendungen: 0",
  );
  // A held Space toggles once, on release.
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  await page.keyboard.up("Space");
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "false");
  // Enter toggles too, as a native button; nothing submits the form.
  await page.keyboard.press("Enter");
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 3, Absendungen: 0",
  );
  await page.keyboard.press("Tab");
  await expect(after(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(theSwitch(page)).toBeFocused();

  // The ring shows on both tracks in the dark theme, too.
  await page.goto(story("default", "dark"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expectRing(theSwitch(page), "dark, unchecked");
  await page.keyboard.press("Space");
  await expectRing(theSwitch(page), "dark, checked");
});

test("a click toggles once, a double click twice", async ({ page }) => {
  await page.goto(story("default"));
  await theSwitch(page).click();
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 1, Absendungen: 0",
  );
  await theSwitch(page).dblclick();
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 3, Absendungen: 0",
  );
});

test("a disabled switch is no tab stop and blocks pointer, label and keys", async ({
  page,
}) => {
  await page.goto(story("disabled"));
  await expect(theSwitch(page)).toBeDisabled();
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "false");
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expect(after(page)).toBeFocused();
  // Real presses: Playwright would wait for the label's control to enable.
  for (const target of [theSwitch(page), page.getByText(label)]) {
    const box = (await target.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await theSwitch(page).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "false");
  await expect(status(page)).toHaveText(
    "Wert: false, Änderungen: 0, Absendungen: 0",
  );

  // Checked and disabled, it keeps its state the same way.
  await page.goto(story("disabled-checked"));
  await expect(theSwitch(page)).toBeDisabled();
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  const box = (await theSwitch(page).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 0, Absendungen: 0",
  );
});

test("the thumb slides to the other side and back", async ({ page }) => {
  await page.goto(story("default"));
  await thumb(page).evaluate((node) => {
    const runs: string[] = [];
    Object.assign(window, { thumbRuns: runs });
    node.addEventListener("transitionrun", (event) =>
      runs.push((event as TransitionEvent).propertyName),
    );
  });
  /** How many translate transitions the thumb has started. */
  const slides = () =>
    page.evaluate(
      () =>
        (window as unknown as { thumbRuns: string[] }).thumbRuns.filter(
          (property) => property === "translate",
        ).length,
    );
  const settled = () =>
    thumb(page).evaluate(async (node) => {
      await Promise.allSettled(
        node.getAnimations().map((animation) => animation.finished),
      );
    });
  const start = await thumbOffset(page);

  await theSwitch(page).click();
  // A translate transition runs: the thumb slides, it does not jump.
  await expect.poll(slides, { message: "translate transition" }).toBe(1);
  await settled();
  expect(await thumbOffset(page), "on the other side").toBeGreaterThan(start);

  await theSwitch(page).click();
  await expect.poll(slides, { message: "translate transition back" }).toBe(2);
  await settled();
  expect(await thumbOffset(page), "back at the start").toBe(start);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the thumb is at the other side at once", async ({ page }) => {
    await page.goto(story("default"));
    const start = await thumbOffset(page);
    for (const checked of [true, false]) {
      await theSwitch(page).click();
      await expect(theSwitch(page)).toHaveAttribute(
        "aria-checked",
        String(checked),
      );
      // No transition runs, and the thumb already rests at its end.
      expect(
        await thumb(page).evaluate((node) => node.getAnimations().length),
        "running transitions",
      ).toBe(0);
      const offset = await thumbOffset(page);
      if (checked) expect(offset, "on the other side").toBeGreaterThan(start);
      else expect(offset, "back at the start").toBe(start);
    }
  });
});
