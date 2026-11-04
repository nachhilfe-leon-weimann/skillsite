import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const story = (name = "default", theme = "light") =>
  `/iframe.html?id=forms-select--${name}&viewMode=story&globals=theme:${theme}`;
/**
 * The trigger, found by its name while the list is closed. Radix hides it from
 * AT while the list is open, so the returned locator does not depend on its role.
 */
async function combobox(page: Page, name = "Format") {
  await expect(page.getByRole("combobox", { name, exact: true })).toBeVisible();
  return page.locator("[role=combobox]");
}
const listbox = (page: Page, name = "Format") =>
  page.getByRole("listbox", { name, exact: true });
const status = (page: Page) => page.getByRole("status");
/** The panel element, also while it leaves (hidden from AT then). */
const panel = (page: Page) =>
  page.locator("[data-radix-popper-content-wrapper] > *");

/** Locks and leftovers an open or leaving panel may hold on the page. */
function leftovers(page: Page) {
  return page.evaluate(() => ({
    panels: document.querySelectorAll("[data-radix-popper-content-wrapper]")
      .length,
    bodyPointerEvents: document.body.style.pointerEvents,
    scrollLocked: document.body.hasAttribute("data-scroll-locked"),
    focusGuards: document.querySelectorAll("[data-radix-focus-guard]").length,
    // Elements Radix hid from AT while the panel was open.
    hiddenOutside: document.querySelectorAll("[data-aria-hidden]").length,
  }));
}
const clean = {
  panels: 0,
  bodyPointerEvents: "",
  scrollLocked: false,
  focusGuards: 0,
  hiddenOutside: 0,
};

/** The background colour a token class resolves to on this page. */
function tokenBackground(page: Page, className: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.className = name;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, className);
}

async function geometry(trigger: Locator, page: Page) {
  const triggerBox = (await trigger.boundingBox())!;
  const panelBox = (await panel(page).boundingBox())!;
  return { triggerBox, panelBox };
}

const tones = [
  {
    name: "default",
    label: "Format",
    initial: "Online",
    surface: "bg-surface",
    open: "Enter",
  },
  {
    name: "inverse",
    label: "Dauer",
    initial: "60 Minuten",
    surface: "bg-inverse-raised",
    open: "ArrowDown",
  },
] as const;

for (const theme of ["light", "dark"]) {
  for (const tone of tones) {
    test(`${tone.name} tone: keyboard selection in ${theme}`, async ({
      page,
    }) => {
      await page.goto(story(tone.name, theme));
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const trigger = await combobox(page, tone.label);
      await page.getByRole("button", { name: "Davor" }).focus();
      await page.keyboard.press("Tab");
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toContainText(tone.initial);

      await page.keyboard.press(tone.open);
      const list = listbox(page, tone.label);
      await expect(list).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(trigger).toHaveAttribute(
        "aria-controls",
        (await list.getAttribute("id"))!,
      );
      const options = list.getByRole("option");
      const selected = list.getByRole("option", { selected: true });
      await expect(selected).toBeFocused();
      await expect(selected).toHaveAccessibleName(tone.initial);

      // The panel keeps its look: trigger width, 8px below, tone surface.
      await expect(panel(page)).toHaveCSS("opacity", "1");
      const { triggerBox, panelBox } = await geometry(trigger, page);
      expect(panelBox.width).toBeCloseTo(triggerBox.width, 0);
      expect(panelBox.x).toBeCloseTo(triggerBox.x, 0);
      expect(
        Math.abs(panelBox.y - (triggerBox.y + triggerBox.height + 8)),
      ).toBeLessThan(1);
      await expect(panel(page)).toHaveCSS("border-radius", "16px");
      await expect(panel(page)).toHaveCSS(
        "background-color",
        await tokenBackground(page, tone.surface),
      );

      await page.keyboard.press("End");
      await expect(options.last()).toBeFocused();
      await page.keyboard.press("Home");
      await expect(options.first()).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(options.nth(1)).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(options.nth(2)).toBeFocused();
      // Tab and Shift+Tab do not reach the page behind the open list.
      await page.keyboard.press("Tab");
      await expect(options.nth(2)).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(options.nth(2)).toBeFocused();
      const choice = (await options.nth(2).textContent())!;

      await page.keyboard.press("Enter");
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toContainText(choice);
      await expect(status(page)).toContainText("Änderungen: 1");
      // The key that committed does not reopen the list.
      await expect(panel(page)).toHaveCount(0);
      expect(await leftovers(page)).toEqual(clean);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Danach" })).toBeFocused();
    });
  }
}

test("Space opens and commits; Escape keeps the value and refocuses", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(listbox(page)).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(
    listbox(page).getByRole("option", { name: "Telefon" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Online");
  await expect(status(page)).toContainText("Änderungen: 0");
  await expect(panel(page)).toHaveCount(0);

  await page.keyboard.press("Space");
  await expect(listbox(page)).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(
    listbox(page).getByRole("option", { name: "Telefon" }),
  ).toBeFocused();
  await page.keyboard.press("Space");
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Telefon");
  await expect(status(page)).toHaveText(
    'Wert: "telefon" (string), Änderungen: 1',
  );
  await expect(panel(page)).toHaveCount(0);
});

test("typeahead matches labels, closed and open", async ({ page }) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.focus();
  // Closed: commits the next label starting with the typed text.
  await page.keyboard.press("t");
  await expect(trigger).toContainText("Telefon");
  await expect(listbox(page)).toHaveCount(0);
  await expect(status(page)).toContainText("Änderungen: 1");
  // Open: moves focus to the matching label.
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeVisible();
  await page.keyboard.press("k");
  await expect(
    listbox(page).getByRole("option", { name: "Keine Angabe" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText('Wert: "" (string), Änderungen: 2');
  await expect(trigger).toContainText("Keine Angabe");
});

test("hints describe their option without joining its name", async ({
  page,
}) => {
  await page.goto(story());
  await (await combobox(page)).click();
  const online = listbox(page).getByRole("option", {
    name: "Online",
    exact: true,
  });
  await expect(online).toHaveAccessibleDescription("Per Videoanruf");
  await expect(listbox(page)).toContainText("Ohne Kamera");
});

test("typed values: 1, '1' and '' stay distinct", async ({ page }) => {
  await page.goto(story("typed-values"));
  const trigger = await combobox(page, "Wert");
  const list = listbox(page, "Wert");
  for (const [label, text] of [
    ["Eins als Text", 'Wert: "1" (string), Änderungen: 1'],
    ["Leerer Text", 'Wert: "" (string), Änderungen: 2'],
    ["Eins als Zahl", "Wert: 1 (number), Änderungen: 3"],
  ]) {
    await trigger.click();
    await list.getByRole("option", { name: label }).click();
    await expect(status(page)).toHaveText(text!);
    await expect(trigger).toContainText(label!);
    await expect(panel(page)).toHaveCount(0);
  }
});

test("pointer: the trigger toggles, an option commits, no focus ring", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.click();
  await expect(listbox(page)).toBeVisible();
  // The open trigger keeps its hover look and takes the next press.
  const box = (await trigger.boundingBox())!;
  const hit = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x!, y!)?.closest("[role=combobox]"),
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(hit).toBe(true);
  await expect(listbox(page).getByRole("option", { selected: true })).toHaveCSS(
    "outline-style",
    "none",
  );
  await trigger.click();
  await expect(panel(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(status(page)).toContainText("Änderungen: 0");

  await trigger.click();
  await listbox(page).getByRole("option", { name: "Telefon" }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Telefon");
  await expect(status(page)).toContainText("Änderungen: 1");
  await expect(trigger).toHaveCSS("outline-style", "none");
  await expect(panel(page)).toHaveCount(0);
  expect(await leftovers(page)).toEqual(clean);
  // Back by keyboard from a clicked control, the ring shows again.
  await page.getByRole("button", { name: "Danach" }).click();
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
});

test("a hovering mouse leaves the keyboard's ring and Enter target alone", async ({
  page,
}) => {
  await page.goto(story("inverse"));
  const trigger = await combobox(page, "Dauer");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const list = listbox(page, "Dauer");
  await expect(list).toBeVisible();
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await page.keyboard.press("ArrowDown");
  const ninety = list.getByRole("option", { name: "90 Minuten" });
  const fortyFive = list.getByRole("option", { name: "45 Minuten" });
  await expect(ninety).toBeFocused();
  const resting = await ninety.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  await fortyFive.hover();
  // As before: the ring stays on 90, 45 shows only the hover background.
  await expect(ninety).toBeFocused();
  await expect(ninety).toHaveCSS("outline-style", "solid");
  await expect(fortyFive).toHaveCSS("outline-style", "none");
  await expect(fortyFive).toHaveCSS("background-color", resting);
  await expect(ninety).not.toHaveCSS("background-color", resting);
  // Leaving the list gives the keyboard row its background back.
  await page.mouse.move(2, 2);
  await expect(ninety).toBeFocused();
  await expect(ninety).toHaveCSS("background-color", resting);
  await page.keyboard.press("Enter");
  await expect(trigger).toContainText("90 Minuten");
  await expect(status(page)).toHaveText("Wert: 90 (number), Änderungen: 1");
});

test("a mouse opens and closes on release, not on press", async ({ page }) => {
  await page.goto(story());
  const trigger = await combobox(page);
  const box = (await trigger.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(panel(page)).toHaveCount(0);
  await page.mouse.up();
  await expect(listbox(page)).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel(page)).toHaveCSS("opacity", "1");
  // A held press on the open trigger keeps the list; the release closes it.
  await page.mouse.down();
  await page.waitForTimeout(150);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(listbox(page)).toBeVisible();
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await page.mouse.up();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(panel(page)).toHaveCount(0);
  // A double-click ends closed.
  await trigger.dblclick();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(panel(page)).toHaveCount(0);
});

for (const pointer of ["mouse", "touch"] as const) {
  test(`a ${pointer} press dragged off the open trigger keeps the list`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      hasTouch: pointer === "touch",
    });
    const page = await context.newPage();
    await page.goto(story());
    const trigger = await combobox(page);
    const box = (await trigger.boundingBox())!;
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    const cdp = await context.newCDPSession(page);
    // Press at (x, y), move 150px up off the trigger, release there.
    const dragOff = async () => {
      if (pointer === "mouse") {
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x, y - 150, { steps: 5 });
        await page.mouse.up();
        return;
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (let step = 1; step <= 5; step++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y - 30 * step }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    };
    if (pointer === "mouse") await page.mouse.click(x, y);
    else await page.touchscreen.tap(x, y);
    await expect(listbox(page)).toBeVisible();
    await expect(panel(page)).toHaveCSS("opacity", "1");
    await dragOff();
    await page.waitForTimeout(300);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(listbox(page)).toBeVisible();
    await expect(panel(page)).toHaveCSS("opacity", "1");
    // The next click or tap on the trigger closes it, as before.
    if (pointer === "mouse") await page.mouse.click(x, y);
    else await page.touchscreen.tap(x, y);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(panel(page)).toHaveCount(0);
    await context.close();
  });
}

test("an outside press closes without a change", async ({ page }) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.click();
  await expect(listbox(page)).toBeVisible();
  // A visitor presses outside an open list, not mid-entrance: wait until it has settled.
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await page.mouse.click(5, 5);
  await expect(panel(page)).toHaveCount(0);
  await expect(trigger).toContainText("Online");
  await expect(status(page)).toContainText("Änderungen: 0");
  expect(await leftovers(page)).toEqual(clean);
});

test("disabled: skipped by Tab and closed to the pointer", async ({ page }) => {
  await page.goto(story("disabled"));
  const trigger = await combobox(page, "Dauer");
  await expect(trigger).toBeDisabled();
  await expect(trigger).toHaveCSS("opacity", "0.6");
  await page.getByRole("button", { name: "Davor" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Danach" })).toBeFocused();
  await trigger.click({ force: true });
  await expect(panel(page)).toHaveCount(0);
});

test("near the bottom edge the panel opens above, inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto(story("near-edge"));
  const trigger = await combobox(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeVisible();
  await expect(panel(page)).toHaveAttribute("data-side", "top");
  await expect(panel(page)).toHaveCSS("opacity", "1");
  const { triggerBox, panelBox } = await geometry(trigger, page);
  expect(panelBox.y).toBeGreaterThanOrEqual(0);
  expect(panelBox.y + panelBox.height).toBeCloseTo(triggerBox.y - 8, 0);
  expect(panelBox.width).toBeCloseTo(triggerBox.width, 0);
  // It still enters toward its trigger, from 4px below.
  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect.poll(() => transitionStart(page, "translate")).toBe("0px 4px");
});

/** The `from` value of the panel's running transition of `property`, or null. */
function transitionStart(page: Page, property: string) {
  return page.evaluate((name) => {
    const node = document.querySelector(
      "[data-radix-popper-content-wrapper] > *",
    );
    const transition = node
      ?.getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === name,
      );
    if (!node || !transition) return null;
    const keyframes = transition.effect as KeyframeEffect;
    const frames = keyframes.getKeyframes();
    return String(frames[0]?.[name] ?? null);
  }, property);
}

/** Every running transition of the panel: property, duration and easing. */
function transitions(page: Page) {
  return page.evaluate(() => {
    const node = document.querySelector(
      "[data-radix-popper-content-wrapper] > *",
    );
    return (node?.getAnimations() ?? [])
      .filter((animation) => animation instanceof CSSTransition)
      .map((animation) => {
        const timing = (animation as CSSTransition).effect!.getTiming();
        return `${(animation as CSSTransition).transitionProperty} ${timing.duration} ${timing.easing}`;
      })
      .sort();
  });
}

const flow = "cubic-bezier(0.22, 1, 0.36, 1)";

test("the panel slides and scales in, then out, and leaves no lock", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => transitions(page))
    .toEqual([
      `opacity 260 ${flow}`,
      `scale 260 ${flow}`,
      `translate 260 ${flow}`,
    ]);
  expect(await transitionStart(page, "translate")).toBe("0px -4px");
  expect(await transitionStart(page, "scale")).toBe("0.97");
  await expect(panel(page)).toHaveCSS("transform-origin", /px 0px$/);
  await expect(panel(page)).toHaveCSS("opacity", "1");

  await page.keyboard.press("Escape");
  // Leaving: still drawn for the exit, but inert, hidden from AT, no hits.
  await expect
    .poll(() => transitions(page))
    .toEqual([
      `opacity 160 ${flow}`,
      `scale 160 ${flow}`,
      `translate 160 ${flow}`,
    ]);
  await expect(panel(page)).toHaveAttribute("inert", "");
  await expect(panel(page)).toHaveAttribute("aria-hidden", "true");
  await expect(panel(page)).toHaveCSS("pointer-events", "none");
  await expect(listbox(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(panel(page)).toHaveCount(0);
  expect(await leftovers(page)).toEqual(clean);
});

test("rapid reopen keeps focus in the list and leaves no ghost", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeVisible();
    await page.keyboard.press("Escape");
    // Reopen during the exit: the same panel turns around.
    await page.keyboard.press("ArrowDown");
    await expect(listbox(page)).toBeVisible();
    await expect(
      listbox(page).getByRole("option", { selected: true }),
    ).toBeFocused();
    await expect(panel(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  // A press on the trigger during the exit reopens it, too.
  await trigger.click();
  await listbox(page).getByRole("option", { name: "Telefon" }).click();
  await trigger.click();
  await expect(listbox(page)).toBeVisible();
  await expect(
    listbox(page).getByRole("option", { name: "Telefon" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
  expect(await leftovers(page)).toEqual(clean);
  await expect(status(page)).toContainText("Änderungen: 1");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the panel appears and goes at once", async ({ page }) => {
    await page.goto(story());
    const trigger = await combobox(page);
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toHaveCSS("opacity", "1", { timeout: 500 });
    await expect(panel(page)).toHaveCSS("translate", /^(none|0px)$/);
    await page.keyboard.press("Escape");
    await expect(panel(page)).toHaveCount(0, { timeout: 500 });
    await expect(trigger).toBeFocused();
    expect(await leftovers(page)).toEqual(clean);
  });
});

test.describe("inside a modal Dialog", () => {
  for (const theme of ["light", "dark"]) {
    test(`selection, stacking and topmost-only Escape in ${theme}`, async ({
      page,
    }) => {
      await page.goto(story("in-dialog", theme));
      await page.getByRole("button", { name: "Dialog öffnen" }).click();
      const dialog = page.getByRole("dialog", { name: "Termin anpassen" });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("combobox", { name: "Dauer", exact: true }),
      ).toBeVisible();
      const trigger = dialog.locator("[role=combobox]");
      await trigger.focus();
      await page.keyboard.press("Enter");
      const list = page.getByRole("listbox", { name: "Dauer" });
      await expect(list).toBeVisible();
      await expect(panel(page)).toHaveCSS("opacity", "1");
      // Rendered in place: inside the dialog, its theme and its stacking.
      expect(
        await dialog.evaluate((node) =>
          node.contains(document.querySelector("[role=listbox]")),
        ),
      ).toBe(true);
      await expect(panel(page)).toHaveCSS(
        "background-color",
        await tokenBackground(page, "bg-surface"),
      );
      const box = (await panel(page).boundingBox())!;
      const onTop = await page.evaluate(
        ([x, y]) =>
          !!document.elementFromPoint(x!, y!)?.closest("[role=listbox]"),
        [box.x + box.width / 2, box.y + box.height - 12],
      );
      expect(onTop).toBe(true);

      await page.keyboard.press("ArrowDown");
      await expect(
        list.getByRole("option", { name: "90 Minuten" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(trigger).toBeFocused();
      await expect(trigger).toContainText("90 Minuten");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("status")).toContainText("Änderungen: 1");

      // Escape closes only the topmost layer: first the list, then the dialog.
      await page.keyboard.press("ArrowDown");
      await expect(list).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(list).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(trigger).toBeFocused();
      await expect(panel(page)).toHaveCount(0);
      await expect(page.locator("[role=log]")).toHaveText(
        "Dialog geschlossen: 0",
      );
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(page.locator("[role=log]")).toHaveText(
        "Dialog geschlossen: 1",
      );
      await expect(
        page.getByRole("button", { name: "Dialog öffnen" }),
      ).toBeFocused();

      // A pointer selection inside the dialog keeps the dialog open.
      await page.getByRole("button", { name: "Dialog öffnen" }).click();
      await trigger.click();
      await page.getByRole("option", { name: "45 Minuten" }).click();
      await expect(dialog).toBeVisible();
      await expect(trigger).toContainText("45 Minuten");
      await expect.poll(() => leftovers(page)).toMatchObject({ panels: 0 });
    });
  }
  test("by keyboard: the dialog holds Tab, the list holds Tab, and each dismissal closes one layer", async ({
    page,
  }) => {
    await page.goto(story("in-dialog"));
    const opener = page.getByRole("button", { name: "Dialog öffnen" });
    const dialog = page.getByRole("dialog", { name: "Termin anpassen" });
    const log = page.locator("[role=log]");
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    const trigger = dialog.locator("[role=combobox]");
    // The dialog's own Tab cycle includes the closed Select.
    await expect(dialog.getByRole("button", { name: "Davor" })).toBeFocused();
    for (const name of ["Dauer", "Danach", "Davor", "Dauer"]) {
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveAccessibleName(name);
    }
    await expect(trigger).toBeFocused();

    // Open, the list holds Tab and Shift+Tab; Escape closes only the list.
    await page.keyboard.press("Enter");
    const list = page.getByRole("listbox", { name: "Dauer" });
    const current = list.getByRole("option", { name: "60 Minuten" });
    await expect(current).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(current).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(current).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(dialog).toBeVisible();

    // An outside press while the list is open closes only the list; focus stays in the dialog.
    await page.keyboard.press("Enter");
    await expect(current).toBeFocused();
    await expect(panel(page)).toHaveCSS("opacity", "1");
    await page.mouse.click(5, 5);
    await expect(panel(page)).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(log).toHaveText("Dialog geschlossen: 0");
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
    await expect(trigger).toContainText("60 Minuten");

    // With the list gone, the next outside press closes the dialog, and focus returns to its opener.
    await page.mouse.click(5, 5);
    await expect(dialog).toHaveCount(0);
    await expect(log).toHaveText("Dialog geschlossen: 1");
    await expect(opener).toBeFocused();
    await expect.poll(() => leftovers(page)).toEqual(clean);
  });
});
