import type { Page } from "@playwright/test";

import { expect, expectRing, settledScroll, test } from "./fixtures";

const story = (id: string, name: string, theme = "light") =>
  `/iframe.html?id=forms-${id}--${name}&viewMode=story&globals=theme:${theme}`;
const radios = (page: Page) => page.getByRole("radio");
const radio = (page: Page, name: string) =>
  page.getByRole("radio", { name, exact: true });
const chip = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const status = (page: Page) => page.getByRole("status");
const before = (page: Page) => page.getByRole("button", { name: "Davor" });
const after = (page: Page) => page.getByRole("button", { name: "Danach" });

/** The focused radio is the checked one, and the only one. */
async function expectFocusedAndChecked(page: Page, name: string) {
  await expect(radio(page, name)).toBeFocused();
  await expect(radio(page, name)).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[role=radio][aria-checked=true]")).toHaveCount(1);
}

test("radio rows: one tab stop, arrows move focus and choice, a visible ring", async ({
  page,
}) => {
  await page.goto(story("radiogroup", "default"));
  const group = page.getByRole("radiogroup", { name: "Plattform" });
  await expect(group).toHaveAttribute("aria-required", "true");
  await expect(radios(page)).toHaveCount(3);
  await expect(radio(page, "Microsoft Teams")).toHaveAccessibleDescription(
    "Im Browser oder als App",
  );

  // Tab enters once, at the checked radio, and leaves once.
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expectFocusedAndChecked(page, "Microsoft Teams");
  await expectRing(radio(page, "Microsoft Teams"), "light, checked");
  await page.keyboard.press("Tab");
  await expect(after(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expectFocusedAndChecked(page, "Microsoft Teams");
  await page.keyboard.press("Shift+Tab");
  await expect(before(page)).toBeFocused();
  await page.keyboard.press("Tab");

  // The keys must not scroll the page. Give the story room to scroll, and show
  // first that the same key on a plain button does.
  await page.evaluate(() => {
    document.body.style.minHeight = "300vh";
  });
  await before(page).focus();
  await page.keyboard.press("ArrowDown");
  expect(await settledScroll(page), "a plain button scrolls").toBeGreaterThan(
    0,
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  expect(await settledScroll(page)).toBe(0);
  await page.keyboard.press("Tab");
  await expectFocusedAndChecked(page, "Microsoft Teams");

  for (const [key, name] of [
    ["ArrowDown", "Discord"],
    ["ArrowRight", "Telefon"],
    ["ArrowDown", "Microsoft Teams"],
    ["ArrowUp", "Telefon"],
    ["ArrowLeft", "Discord"],
    ["Home", "Microsoft Teams"],
    ["End", "Telefon"],
  ] as const) {
    await page.keyboard.press(key);
    await expectFocusedAndChecked(page, name);
  }
  expect(await settledScroll(page), "the radio keys scroll nothing").toBe(0);
  await expect(status(page)).toHaveText(
    'Wert: "telefon", Änderungen: 7, Absendungen: 0',
  );

  // Space and Enter on the checked radio keep it; nothing submits the form.
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expectFocusedAndChecked(page, "Telefon");
  await expect(status(page)).toHaveText(
    'Wert: "telefon", Änderungen: 7, Absendungen: 0',
  );
  await page.keyboard.press("Tab");
  await expect(after(page)).toBeFocused();

  // The ring shows in the dark theme, too.
  await page.goto(story("radiogroup", "default", "dark"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expectRing(radio(page, "Microsoft Teams"), "dark, checked");
});

test("single chips: one tab stop, the checked chip stays checked, a visible ring", async ({
  page,
}) => {
  await page.goto(story("choicechips", "single"));
  await expect(
    page.getByRole("radiogroup", {
      name: "In welchem Fach kann ich dir helfen?",
    }),
  ).toHaveAttribute("aria-required", "true");
  await expect(page.locator("[role=radio][aria-checked=true]")).toHaveCount(0);

  // An empty group: Tab enters at the first chip without checking it.
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expect(radio(page, "Mathe")).toBeFocused();
  await expect(radio(page, "Mathe")).toHaveAttribute("aria-checked", "false");
  await expectRing(radio(page, "Mathe"), "light, unchecked");

  await page.keyboard.press("Space");
  await expectFocusedAndChecked(page, "Mathe");
  // Before, activating the checked chip again cleared the choice.
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expectFocusedAndChecked(page, "Mathe");
  // The ring stays visible on the checked chip's surface.
  await expectRing(radio(page, "Mathe"), "light, checked");
  await expect(status(page)).toHaveText(
    'Wert: "Mathe", Änderungen: 1, Absendungen: 0',
  );

  await page.keyboard.press("ArrowRight");
  await expectFocusedAndChecked(page, "Physik");
  await page.keyboard.press("ArrowLeft");
  await expectFocusedAndChecked(page, "Mathe");
  await page.keyboard.press("Tab");
  await expect(after(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expectFocusedAndChecked(page, "Mathe");
  await expect(status(page)).toHaveText(
    'Wert: "Mathe", Änderungen: 3, Absendungen: 0',
  );

  // The ring shows on both surfaces in the dark theme, too.
  await page.goto(story("choicechips", "single", "dark"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expectRing(radio(page, "Mathe"), "dark, unchecked");
  await page.keyboard.press("Space");
  await expectRing(radio(page, "Mathe"), "dark, checked");
});

test("multiple chips: independent pressed toggles, each a tab stop", async ({
  page,
}) => {
  await page.goto(story("choicechips", "multiple"));
  await expect(page.getByRole("group", { name: "Fächer" })).toBeVisible();
  await expect(page.getByRole("toolbar")).toHaveCount(0);
  await expect(chip(page, "Physik")).toHaveAttribute("aria-pressed", "true");

  await before(page).focus();
  for (const name of ["Mathe", "Physik", "Englisch", "Deutsch"]) {
    await page.keyboard.press("Tab");
    await expect(chip(page, name)).toBeFocused();
  }
  await page.keyboard.press("Space");
  await expect(chip(page, "Deutsch")).toHaveAttribute("aria-pressed", "true");
  // Arrow keys do not move between independent toggles.
  await page.keyboard.press("ArrowLeft");
  await expect(chip(page, "Deutsch")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(chip(page, "Physik")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(chip(page, "Physik")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Space");
  await expect(status(page)).toHaveText(
    'Wert: ["Deutsch","Mathe"], Änderungen: 3, Absendungen: 0',
  );
  await page.keyboard.press("Space");
  await expect(status(page)).toHaveText(
    'Wert: ["Deutsch"], Änderungen: 4, Absendungen: 0',
  );
});

test("rapid and held arrow keys keep focus and the checked chip in sync", async ({
  page,
}) => {
  await page.goto(story("choicechips", "single-preselected"));
  await radio(page, "Englisch").focus();
  // Rapid real presses, without waiting in between.
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  const settle = async () => {
    await expect
      .poll(() =>
        page.evaluate(() => {
          const focused = document.activeElement!;
          const checked = document.querySelectorAll(
            "[role=radio][aria-checked=true]",
          );
          return checked.length === 1 && checked[0] === focused;
        }),
      )
      .toBe(true);
  };
  // Let the focus moves the keys queued run first.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        setTimeout(() => requestAnimationFrame(resolve)),
      ),
  );
  await settle();

  // A held key, on a fresh story: repeated keydowns, one keyup.
  await page.goto(story("choicechips", "single-preselected"));
  await radio(page, "Englisch").focus();
  const changes = async () =>
    Number((await status(page).textContent())!.match(/Änderungen: (\d+)/)![1]);
  const changesBefore = await changes();
  const focused = () =>
    page.evaluate(() => document.activeElement!.textContent!);
  const sequence = [await focused()];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.down("ArrowRight");
    await expect.poll(focused).not.toBe(sequence.at(-1));
    await settle();
    sequence.push(await focused());
  }
  await page.keyboard.up("ArrowRight");
  await settle();
  // Each repeat moved one chip on, wrapping around the four.
  const order = ["Mathe", "Physik", "Englisch", "Deutsch"];
  sequence.forEach((name, index) => {
    if (index > 0)
      expect(order.indexOf(name)).toBe(
        (order.indexOf(sequence[index - 1]!) + 1) % order.length,
      );
  });
  // Each step changed the value once.
  expect(await changes()).toBe(changesBefore + 5);
});

test("an empty optional group starts empty and Space checks the focused radio", async ({
  page,
}) => {
  await page.goto(story("radiogroup", "empty"));
  await expect(
    page.getByRole("radiogroup", { name: "Plattform" }),
  ).not.toHaveAttribute("aria-required");
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expect(radio(page, "Microsoft Teams")).toBeFocused();
  await expect(page.locator("[role=radio][aria-checked=true]")).toHaveCount(0);
  await page.keyboard.press("Space");
  await expectFocusedAndChecked(page, "Microsoft Teams");
  await expect(status(page)).toHaveText(
    'Wert: "teams", Änderungen: 1, Absendungen: 0',
  );
});

test("disabled options are skipped and inert; a disabled group is no tab stop", async ({
  page,
}) => {
  await page.goto(story("radiogroup", "disabled-option"));
  await expect(radio(page, "Discord")).toBeDisabled();
  await radio(page, "Discord").click({ force: true });
  await radio(page, "Microsoft Teams").focus();
  await page.keyboard.press("ArrowDown");
  await expectFocusedAndChecked(page, "Telefon");
  await page.keyboard.press("ArrowUp");
  await expectFocusedAndChecked(page, "Microsoft Teams");
  await expect(status(page)).toContainText("Änderungen: 2");

  await page.goto(story("radiogroup", "disabled"));
  for (const element of await radios(page).all())
    await expect(element).toBeDisabled();
  await before(page).focus();
  await page.keyboard.press("Tab");
  await expect(after(page)).toBeFocused();

  await page.goto(story("choicechips", "disabled-chip"));
  for (const element of [radio(page, "Physik"), chip(page, "Physik")]) {
    await expect(element).toBeDisabled();
    await element.click({ force: true });
  }
  await expect(status(page).first()).toContainText("Änderungen: 0");
  await expect(status(page).last()).toContainText("Änderungen: 0");
});
