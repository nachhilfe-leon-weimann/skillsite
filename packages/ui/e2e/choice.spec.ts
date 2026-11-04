import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

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

/** The focus ring token, resolved on this page and theme. */
function ringColor(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--focus-ring-color)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
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
  await expect(element).toHaveCSS("outline-color", await ringColor(page));
}

/** The focused radio is the checked one, and the only one. */
async function expectFocusedAndChecked(page: Page, name: string) {
  await expect(radio(page, name)).toBeFocused();
  await expect(radio(page, name)).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[role=radio][aria-checked=true]")).toHaveCount(1);
}

/** Keys pressed and released in one task, before Radix's deferred focus runs. */
function quickPress(page: Page, ...keys: string[]) {
  return page.evaluate((keys) => {
    const target = document.activeElement!;
    for (const key of keys)
      for (const type of ["keydown", "keyup"])
        target.dispatchEvent(
          new KeyboardEvent(type, { key, bubbles: true, cancelable: true }),
        );
  }, keys);
}

for (const theme of ["light", "dark"]) {
  test(`radio rows: one tab stop, arrows move focus and choice, rings in ${theme}`, async ({
    page,
  }) => {
    await page.goto(story("radiogroup", "default", theme));
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
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
    await expectRing(page, radio(page, "Microsoft Teams"));
    await page.keyboard.press("Tab");
    await expect(after(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expectFocusedAndChecked(page, "Microsoft Teams");
    await page.keyboard.press("Shift+Tab");
    await expect(before(page)).toBeFocused();
    await page.keyboard.press("Tab");

    const scroll = await page.evaluate(() => scrollY);
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
    await expectRing(page, radio(page, "Telefon"));
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
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
  });

  test(`single chips: one tab stop, the checked chip stays checked, rings in ${theme}`, async ({
    page,
  }) => {
    await page.goto(story("choicechips", "single", theme));
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("radiogroup", {
        name: "In welchem Fach kann ich dir helfen?",
      }),
    ).toHaveAttribute("aria-required", "true");
    await expect(page.locator("[role=radio][aria-checked=true]")).toHaveCount(
      0,
    );

    // An empty group: Tab enters at the first chip without checking it.
    await before(page).focus();
    await page.keyboard.press("Tab");
    await expect(radio(page, "Mathe")).toBeFocused();
    await expect(radio(page, "Mathe")).toHaveAttribute("aria-checked", "false");
    await expectRing(page, radio(page, "Mathe"));

    await page.keyboard.press("Space");
    await expectFocusedAndChecked(page, "Mathe");
    // Before, activating the checked chip again cleared the choice.
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await expectFocusedAndChecked(page, "Mathe");
    // The ring stays visible on the checked chip's coral surface.
    await expectRing(page, radio(page, "Mathe"));
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
  });

  test(`multiple chips: independent pressed toggles, each a tab stop, rings in ${theme}`, async ({
    page,
  }) => {
    await page.goto(story("choicechips", "multiple", theme));
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("group", { name: "Fächer" })).toBeVisible();
    await expect(page.getByRole("toolbar")).toHaveCount(0);
    await expect(chip(page, "Physik")).toHaveAttribute("aria-pressed", "true");

    await before(page).focus();
    for (const name of ["Mathe", "Physik", "Englisch", "Deutsch"]) {
      await page.keyboard.press("Tab");
      await expect(chip(page, name)).toBeFocused();
    }
    await expectRing(page, chip(page, "Deutsch"));
    await page.keyboard.press("Space");
    await expect(chip(page, "Deutsch")).toHaveAttribute("aria-pressed", "true");
    await expectRing(page, chip(page, "Deutsch"));
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
}

test("quick key presses keep focus and the checked radio in sync", async ({
  page,
}) => {
  await page.goto(story("radiogroup", "default"));
  await radio(page, "Microsoft Teams").focus();
  for (const [key, name] of [
    ["ArrowDown", "Discord"],
    ["ArrowDown", "Telefon"],
    ["ArrowDown", "Microsoft Teams"],
    ["ArrowUp", "Telefon"],
    ["Home", "Microsoft Teams"],
    ["End", "Telefon"],
  ] as const) {
    await quickPress(page, key);
    await expectFocusedAndChecked(page, name);
  }
  await expect(status(page)).toContainText("Änderungen: 6");
  // Two keys before the first focus arrives: both start from Telefon.
  await quickPress(page, "ArrowUp", "ArrowDown");
  await expectFocusedAndChecked(page, "Microsoft Teams");
  await expect(status(page)).toContainText("Änderungen: 8");
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

test("the pointer checks on release, not on press, and a gap takes no focus", async ({
  page,
}) => {
  await page.goto(story("radiogroup", "default"));
  const discord = radio(page, "Discord");
  const box = (await discord.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(discord).toBeFocused();
  await expect(discord).toHaveAttribute("aria-checked", "false");
  await page.mouse.up();
  await expectFocusedAndChecked(page, "Discord");
  // No ring after a click, as before.
  expect(await discord.evaluate((node) => node.matches(":focus-visible"))).toBe(
    false,
  );

  // A press dragged off a radio changes nothing.
  const telefon = (await radio(page, "Telefon").boundingBox())!;
  await page.mouse.move(telefon.x + 20, telefon.y + 20);
  await page.mouse.down();
  await page.mouse.move(telefon.x + 20, telefon.y + 200, { steps: 4 });
  await page.mouse.up();
  await expect(radio(page, "Telefon")).toHaveAttribute("aria-checked", "false");
  await expect(status(page)).toContainText("Änderungen: 1");

  // The gap between two rows: no focus there; Tab then enters at the checked one.
  await before(page).focus();
  const teams = (await radio(page, "Microsoft Teams").boundingBox())!;
  await page.mouse.click(teams.x + teams.width + 4, teams.y + teams.height / 2);
  expect(
    await page.evaluate(() => document.activeElement === document.body),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expectFocusedAndChecked(page, "Discord");
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
