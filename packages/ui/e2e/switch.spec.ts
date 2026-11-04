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

/** A token, resolved on this page and theme as a computed colour. */
function token(page: Page, name: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

/** The keyboard focus ring: the base outline in the focus ring token. */
async function expectRing(page: Page, element: Locator) {
  await expect(element).toBeFocused();
  expect(await element.evaluate((node) => node.matches(":focus-visible"))).toBe(
    true,
  );
  await expect(element).toHaveCSS("outline-style", "solid");
  await expect(element).toHaveCSS("outline-width", "3px");
  await expect(element).toHaveCSS("outline-offset", "3px");
  await expect(element).toHaveCSS(
    "outline-color",
    await token(page, "--focus-ring-color"),
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

/** The 44x24 track in coral or line, the 20x20 white thumb at 22 or 2px. */
async function expectLook(page: Page, checked: boolean) {
  const element = theSwitch(page);
  await expect(element).toHaveAttribute("aria-checked", String(checked));
  await expect(element).toHaveCSS(
    "background-color",
    await token(page, checked ? "--coral" : "--line"),
  );
  await expect.poll(() => thumbOffset(page)).toBe(checked ? 22 : 2);
  expect(await element.boundingBox()).toMatchObject({ width: 44, height: 24 });
  expect(await thumb(page).boundingBox()).toMatchObject({
    width: 20,
    height: 20,
  });
  // Fully rounded: `rounded-full` resolves to an infinite radius.
  for (const part of [element, thumb(page)])
    expect(
      await part.evaluate((node) =>
        parseFloat(getComputedStyle(node).borderTopLeftRadius),
      ),
    ).toBeGreaterThan(1e6);
  await expect(thumb(page)).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(thumb(page)).toHaveAttribute("aria-hidden", "true");
}

/** The thumb offsets of every frame for 400ms while `act` runs. */
async function framesDuring(page: Page, act: () => Promise<void>) {
  const frames = theSwitch(page).evaluate(
    (track) =>
      new Promise<number[]>((resolve) => {
        const offsets: number[] = [];
        const start = performance.now();
        const sample = () => {
          offsets.push(
            track.firstElementChild!.getBoundingClientRect().left -
              track.getBoundingClientRect().left,
          );
          if (performance.now() - start < 400) requestAnimationFrame(sample);
          else resolve(offsets);
        };
        requestAnimationFrame(sample);
      }),
  );
  await act();
  return frames;
}

for (const theme of ["light", "dark"]) {
  test(`named, keyboard toggles once, rings and look in ${theme}`, async ({
    page,
  }) => {
    await page.goto(story("default", theme));
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(theSwitch(page)).toHaveAttribute("type", "button");
    await expectLook(page, false);

    // One tab stop, with the ring on the unchecked and the checked track.
    await before(page).focus();
    await page.keyboard.press("Tab");
    await expectRing(page, theSwitch(page));
    await page.keyboard.press("Space");
    await expectLook(page, true);
    await expectRing(page, theSwitch(page));
    await expect(status(page)).toHaveText(
      "Wert: true, Änderungen: 1, Absendungen: 0",
    );
    // A held Space toggles once, on release.
    await page.keyboard.down("Space");
    await page.keyboard.down("Space");
    await page.keyboard.down("Space");
    await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");
    await page.keyboard.up("Space");
    await expectLook(page, false);
    // Enter toggles too, as a native button; nothing submits the form.
    await page.keyboard.press("Enter");
    await expectLook(page, true);
    await expect(status(page)).toHaveText(
      "Wert: true, Änderungen: 3, Absendungen: 0",
    );
    await page.keyboard.press("Tab");
    await expect(after(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expectRing(page, theSwitch(page));
  });
}

test("the pointer toggles once on release; a press dragged off does nothing", async ({
  page,
}) => {
  await page.goto(story("default"));
  const box = (await theSwitch(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(theSwitch(page)).toBeFocused();
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "false");
  await page.mouse.up();
  await expectLook(page, true);
  // No ring after a click.
  expect(
    await theSwitch(page).evaluate((node) => node.matches(":focus-visible")),
  ).toBe(false);

  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 200, { steps: 4 });
  await page.mouse.up();
  await expect(theSwitch(page)).toHaveAttribute("aria-checked", "true");

  // A double click toggles twice: once per click.
  await theSwitch(page).dblclick();
  await expectLook(page, true);
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 3, Absendungen: 0",
  );
});

test("its label toggles it once; outside changes and a reset are the parent's", async ({
  page,
}) => {
  await page.goto(story("default"));
  await page.getByText(label, { exact: true }).click();
  await expectLook(page, true);
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 1, Absendungen: 0",
  );

  // A controlled change from outside moves the switch without a callback.
  await page.getByRole("button", { name: "Von außen umschalten" }).click();
  await expectLook(page, false);
  await page.getByRole("button", { name: "Von außen umschalten" }).click();
  await expectLook(page, true);
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 1, Absendungen: 0",
  );

  // A form reset leaves the switch as it is, as before.
  await page.getByRole("button", { name: "Formular zurücksetzen" }).click();
  await expectLook(page, true);
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 1, Absendungen: 0",
  );
  // The form holds no native input beside the switch.
  await expect(page.locator("form input")).toHaveCount(0);
});

test("aria-labelledby and aria-label name the checked and unchecked variants", async ({
  page,
}) => {
  await page.goto(story("checked"));
  await expectLook(page, true);
  await theSwitch(page).click();
  await expectLook(page, false);

  await page.goto(story("unchecked"));
  await expect(page.getByText(label)).toHaveCount(0);
  await expectLook(page, false);
  await theSwitch(page).click();
  await expectLook(page, true);
  await expect(status(page)).toHaveText(
    "Wert: true, Änderungen: 1, Absendungen: 0",
  );
});

for (const [name, checked] of [
  ["disabled", false],
  ["disabled-checked", true],
] as const) {
  test(`a ${name} switch is no tab stop and blocks pointer, label and keys`, async ({
    page,
  }) => {
    await page.goto(story(name));
    await expect(theSwitch(page)).toBeDisabled();
    await expectLook(page, checked);
    await expect(theSwitch(page)).toHaveCSS("opacity", "0.6");
    await expect(theSwitch(page)).toHaveCSS("cursor", "not-allowed");
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
    await expectLook(page, checked);
    await expect(status(page)).toHaveText(
      `Wert: ${checked}, Änderungen: 0, Absendungen: 0`,
    );
  });
}

test("the thumb and track travel in the quick soft transition", async ({
  page,
}) => {
  await page.goto(story("default"));
  await expect(theSwitch(page)).toHaveCSS("transition-duration", "0.16s");
  await expect(theSwitch(page)).toHaveCSS(
    "transition-timing-function",
    "cubic-bezier(0.65, 0, 0.35, 1)",
  );
  await expect(thumb(page)).toHaveCSS("transition-duration", "0.16s");
  expect(
    await thumb(page).evaluate(
      (node) => getComputedStyle(node).transitionProperty,
    ),
  ).toContain("translate");
  for (const checked of [true, false]) {
    const frames = await framesDuring(page, () => theSwitch(page).click());
    // Frames between the two ends: the thumb slides, it does not jump.
    expect(frames.some((offset) => offset > 2.5 && offset < 21.5)).toBe(true);
    expect(frames.at(-1)).toBe(checked ? 22 : 2);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the thumb jumps without frames in between", async ({ page }) => {
    await page.goto(story("default"));
    for (const checked of [true, false]) {
      const frames = await framesDuring(page, () => theSwitch(page).click());
      expect(frames.filter((offset) => offset > 2.5 && offset < 21.5)).toEqual(
        [],
      );
      expect(frames.at(-1)).toBe(checked ? 22 : 2);
      await expectLook(page, checked);
    }
  });
});
