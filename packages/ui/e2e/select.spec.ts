import type { Locator, Page } from "@playwright/test";

import { expect, holdExit, test } from "./fixtures";

const story = (name = "default") =>
  `/iframe.html?id=forms-select--${name}&viewMode=story&globals=theme:light`;
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

async function geometry(trigger: Locator, page: Page) {
  const triggerBox = (await trigger.boundingBox())!;
  const panelBox = (await panel(page).boundingBox())!;
  return { triggerBox, panelBox };
}

test("keyboard selection: opens on the selected option, holds Tab and commits once", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await page.getByRole("button", { name: "Davor" }).focus();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toContainText("Online");

  await page.keyboard.press("Enter");
  const list = listbox(page);
  await expect(list).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute(
    "aria-controls",
    (await list.getAttribute("id"))!,
  );
  const options = list.getByRole("option");
  const selected = list.getByRole("option", { selected: true });
  await expect(selected).toBeFocused();
  await expect(selected).toHaveAccessibleName("Online");

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

  // ArrowDown opens it as well, again on the selected option.
  await page.keyboard.press("ArrowDown");
  await expect(list).toBeVisible();
  await expect(selected).toBeFocused();
  await expect(selected).toHaveAccessibleName(choice);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(panel(page)).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Danach" })).toBeFocused();
  await expect(status(page)).toContainText("Änderungen: 1");
});

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

test("pointer: the trigger toggles and an option commits", async ({ page }) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.click();
  await expect(listbox(page)).toBeVisible();
  // A click on the open trigger closes it without a change.
  await trigger.click();
  await expect(panel(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(status(page)).toContainText("Änderungen: 0");

  await trigger.click();
  await listbox(page).getByRole("option", { name: "Telefon" }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Telefon");
  await expect(status(page)).toContainText("Änderungen: 1");
  await expect(panel(page)).toHaveCount(0);
  expect(await leftovers(page)).toEqual(clean);
});

test("a hovering mouse leaves the keyboard's Enter target alone", async ({
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
  await expect(ninety).toBeFocused();
  // A mouse resting on another row does not take the keyboard's focus.
  await list.getByRole("option", { name: "45 Minuten" }).hover();
  await expect(ninety).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toContainText("90 Minuten");
  await expect(status(page)).toHaveText("Wert: 90 (number), Änderungen: 1");
});

test("an outside press closes without a change and refocuses the trigger", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.click();
  await expect(listbox(page)).toBeVisible();
  // A visitor presses outside an open list, not mid-entrance: wait until it has settled.
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await page.mouse.click(5, 5);
  await expect(panel(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Online");
  await expect(status(page)).toContainText("Änderungen: 0");
  expect(await leftovers(page)).toEqual(clean);
});

test("disabled: skipped by Tab and closed to the pointer", async ({ page }) => {
  await page.goto(story("disabled"));
  const trigger = await combobox(page, "Dauer");
  await expect(trigger).toBeDisabled();
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
  expect(panelBox.y, "top edge").toBeGreaterThanOrEqual(0);
  expect(panelBox.y + panelBox.height, "above the trigger").toBeLessThanOrEqual(
    triggerBox.y,
  );
  const options = listbox(page).getByRole("option");
  await expect(options.first()).toBeInViewport({ ratio: 1 });
  await expect(options.last()).toBeInViewport({ ratio: 1 });
});

test("the closing panel is inert at once and leaves no lock", async ({
  page,
}) => {
  await page.goto(story());
  const trigger = await combobox(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(panel(page)).toHaveCSS("opacity", "1");

  await page.keyboard.press("Escape");
  // Leaving: still drawn for the exit, but inert, hidden from AT, no hits.
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

test.describe("inside a modal Dialog", () => {
  test("selection, stacking and topmost-only Escape", async ({ page }) => {
    await page.goto(story("in-dialog"));
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
    // Rendered in place: inside the dialog and on top of it.
    expect(
      await dialog.evaluate((node) =>
        node.contains(document.querySelector("[role=listbox]")),
      ),
    ).toBe(true);
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

  test("by keyboard: the dialog holds Tab, the list holds Tab, and each dismissal closes one layer and returns focus to its opener", async ({
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

    // An outside press while the list is open closes only the list; focus
    // returns to the trigger, as after Escape, not to the dialog's panel.
    await page.keyboard.press("Enter");
    await expect(current).toBeFocused();
    await expect(panel(page)).toHaveCSS("opacity", "1");
    await page.mouse.click(5, 5);
    await expect(panel(page)).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(log).toHaveText("Dialog geschlossen: 0");
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("60 Minuten");

    // With the list gone, the next outside press closes the dialog, and focus returns to its opener.
    await page.mouse.click(5, 5);
    await expect(dialog).toHaveCount(0);
    await expect(log).toHaveText("Dialog geschlossen: 1");
    await expect(opener).toBeFocused();
    await expect.poll(() => leftovers(page)).toEqual(clean);
  });

  test("focus that moved on while the list was leaving stays there", async ({
    page,
  }) => {
    await page.goto(story("in-dialog"));
    await page.getByRole("button", { name: "Dialog öffnen" }).click();
    const dialog = page.getByRole("dialog", { name: "Termin anpassen" });
    const trigger = dialog.locator("[role=combobox]");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("option", { name: "60 Minuten" }),
    ).toBeFocused();
    await expect(panel(page)).toHaveCSS("opacity", "1");

    // The outside press closes the list; while it leaves, Tab moves focus on.
    const release = await holdExit(page);
    await page.mouse.click(5, 5);
    await expect(panel(page)).toHaveAttribute("inert", "");
    await page.keyboard.press("Tab");
    const moved = await page.evaluateHandle(() => document.activeElement);
    expect(
      await page.evaluate(
        ([node, dialog]) =>
          node instanceof HTMLButtonElement &&
          node.getAttribute("role") !== "combobox" &&
          dialog.contains(node),
        [moved, await dialog.elementHandle()] as const,
      ),
    ).toBe(true);

    await release();
    await expect(panel(page)).toHaveCount(0);
    // The list's close autofocus runs in a task queued at its unmount: let it run.
    await page.evaluate(() => new Promise((done) => setTimeout(done)));
    expect(
      await page.evaluate((node) => document.activeElement === node, moved),
    ).toBe(true);
    await expect(dialog).toBeVisible();
  });
});
