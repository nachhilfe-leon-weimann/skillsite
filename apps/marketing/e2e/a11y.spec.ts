import { expect, test, type Page } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";
import { indexablePaths } from "../src/lib/routes";
import { platformNav, primaryCta, primaryNav } from "../src/content/site";
import { MENU_STATE_EVENT } from "../src/components/layout/ios-toolbar-tint";

test.beforeEach(async ({ page }) => {
  await isolate(page);
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the theme buttons have names", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Farbschema wählen" });
    await expect(group.getByRole("button", { name: "Hell" })).toBeVisible();
    await expect(group.getByRole("button", { name: "Dunkel" })).toBeVisible();
  });

  test("Escape closes the menu and returns focus to its button", async ({
    page,
  }) => {
    await page.goto("/preise");
    const menuButton = page.getByRole("button", { name: "Menü" });
    await menuButton.click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();
  });

  test("the mobile menu marks the current page", async ({ page }) => {
    await page.goto("/preise");
    await page.getByRole("button", { name: "Menü" }).click();
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Preise" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      banner.getByRole("link", { name: "Ablauf" }),
    ).not.toHaveAttribute("aria-current");
  });

  test("a section link is never the current page", async ({ page }) => {
    await page.goto("/online-lernen");
    await page.getByRole("button", { name: "Menü" }).click();
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Online lernen" })
      .click();
    const links = page.locator("#mobile-platform-nav a");
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(page.locator('#mobile-platform-nav a[href*="#"]')).toHaveCount(
      1,
    );
    await expect(
      page.locator('#mobile-platform-nav a[href*="#"]'),
    ).not.toHaveAttribute("aria-current");
  });
});

/** Records every menu state event the iOS toolbar tint receives, across client navigations. */
async function recordMenuState(page: Page) {
  await page.addInitScript((name) => {
    const events: boolean[] = [];
    Object.assign(window, { menuStateEvents: events });
    window.addEventListener(name, (event) =>
      events.push((event as CustomEvent<{ open: boolean }>).detail.open),
    );
  }, MENU_STATE_EVENT);
}

const menuStateEvents = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { menuStateEvents: boolean[] }).menuStateEvents,
  );

/** Presses `key` `count` times; per stop, the focused element's name, prefixed when it is outside the dialog. */
async function focusStops(page: Page, key: "Tab" | "Shift+Tab", count: number) {
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(key);
    stops.push(
      await page.evaluate(() => {
        const element = document.activeElement;
        const name =
          element?.getAttribute("aria-label") ??
          element?.textContent?.trim() ??
          "";
        return element?.closest("[role='dialog']") ? name : `outside: ${name}`;
      }),
    );
  }
  return stops;
}

/** What the page behind an open dialog exposes: aria-hidden/inert state and the scroll lock. */
const background = (page: Page) =>
  page.evaluate(() => ({
    mainHidden: !!document
      .querySelector("main")
      ?.closest("[aria-hidden='true'], [inert]"),
    footerHidden: !!document
      .querySelector("footer")
      ?.closest("[aria-hidden='true'], [inert]"),
    headerInert: !!document.querySelector("body header")?.closest("[inert]"),
    hiddenRoots: [...document.body.children]
      .filter((node) => node.getAttribute("aria-hidden") === "true")
      .map((node) => node.id || node.tagName.toLowerCase()),
    inert: document.querySelectorAll("[inert]").length,
    overflow: getComputedStyle(document.body).overflow,
    focusGuards: document.querySelectorAll("[data-radix-focus-guard]").length,
  }));

const released = {
  mainHidden: false,
  footerHidden: false,
  headerInert: false,
  overflow: "visible",
  focusGuards: 0,
};

const primaryLabels = primaryNav.map((item) => item.label);
const platformLabels = platformNav.map((item) => item.label);

test.describe("the mobile navigation dialog", () => {
  const opener = (page: Page) => page.getByRole("button", { name: "Menü" });
  const dialog = (page: Page) => page.getByRole("dialog", { name: "Menü" });
  const closeControl = (page: Page) =>
    dialog(page).getByRole("button", { name: "Menü" });

  test.beforeEach(async ({ page }) => {
    await recordMenuState(page);
  });

  for (const width of [390, 1079]) {
    test.describe(`at ${width}px`, () => {
      test.use({ viewport: { width, height: 800 } });

      test("is a named modal holding the whole header; the page behind is unreachable", async ({
        page,
      }) => {
        await page.goto("/preise");
        await opener(page).click();
        await expect(dialog(page)).toBeVisible();
        await expect(dialog(page)).toHaveAttribute("aria-modal", "true");
        // One banner, one logo link and one menu control remain for AT: the dialog's.
        await expect(page.getByRole("banner")).toHaveCount(1);
        const banner = dialog(page).getByRole("banner");
        await expect(banner).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Startseite" }),
        ).toHaveCount(1);
        await expect(
          banner.getByRole("link", { name: "Startseite" }),
        ).toBeVisible();
        await expect(page.getByRole("button", { name: "Menü" })).toHaveCount(1);
        await expect(closeControl(page)).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        await expect(
          banner.getByRole("link", { name: "Preise" }),
        ).toHaveAttribute("aria-current", "page");
        await expect(
          banner.getByRole("link", { name: primaryCta.label }),
        ).toBeVisible();
        expect(await background(page)).toMatchObject({
          mainHidden: true,
          footerHidden: true,
          headerInert: true,
          overflow: "hidden",
        });
      });

      test("Tab and Shift+Tab cycle through the header and menu controls only", async ({
        page,
      }) => {
        await page.goto("/");
        await opener(page).focus();
        await page.keyboard.press("Enter");
        await expect(opener(page)).toHaveAttribute("aria-expanded", "true");
        // As on main, the menu control (in the dialog now) keeps focus where it was.
        await expect(page.getByRole("button", { name: "Menü" })).toBeFocused();
        const cycle = [
          ...primaryLabels,
          "Online lernen",
          primaryCta.label,
          "Startseite",
          "Menü",
        ];
        expect(await focusStops(page, "Tab", cycle.length * 2)).toEqual([
          ...cycle,
          ...cycle,
        ]);
        expect(await focusStops(page, "Shift+Tab", cycle.length * 2)).toEqual([
          ...cycle.slice(0, -1).reverse(),
          "Menü",
          ...cycle.slice(0, -1).reverse(),
          "Menü",
        ]);

        // The expanded platform list joins the cycle; collapsed, it was skipped above.
        await dialog(page)
          .getByRole("button", { name: "Online lernen" })
          .click();
        await expect(
          dialog(page).getByRole("button", { name: "Online lernen" }),
        ).toHaveAttribute("aria-expanded", "true");
        const expanded = [
          ...platformLabels.map((label) => expect.stringMatching(`^${label}`)),
          primaryCta.label,
          "Startseite",
          "Menü",
          ...primaryLabels,
          "Online lernen",
        ];
        expect(await focusStops(page, "Tab", expanded.length)).toEqual(
          expanded,
        );
      });
    });
  }

  test.describe("at phone width", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("Escape closes it once and returns focus to the opener", async ({
      page,
    }) => {
      await page.goto("/");
      await opener(page).focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Escape");
      await expect(dialog(page)).toHaveCount(0);
      await expect(opener(page)).toBeFocused();
      await expect(opener(page)).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("Escape");
      await expect(opener(page)).toBeFocused();
      expect(await menuStateEvents(page)).toEqual([true, false]);
      expect(await background(page)).toMatchObject(released);
    });

    test("the close control closes it and returns focus to the opener", async ({
      page,
    }) => {
      await page.goto("/");
      await opener(page).click();
      await closeControl(page).click();
      await expect(dialog(page)).toHaveCount(0);
      await expect(opener(page)).toBeFocused();
      expect(await menuStateEvents(page)).toEqual([true, false]);
      expect(await background(page)).toMatchObject(released);
    });

    for (const target of [
      "Preise",
      "Startseite",
      primaryCta.label,
      "Discord",
    ]) {
      test(`the ${target} link navigates on the client, closes it and leaves focus to the destination`, async ({
        page,
      }) => {
        await page.goto(target === "Startseite" ? "/preise" : "/");
        await page.evaluate(() =>
          Object.assign(window, { navigationMarker: true }),
        );
        await opener(page).click();
        if (target === "Discord")
          await dialog(page)
            .getByRole("button", { name: "Online lernen" })
            .click();
        await dialog(page)
          .getByRole("link", { name: new RegExp(`^${target}`) })
          .click();
        await expect(page).not.toHaveURL(
          target === "Startseite" ? /\/preise$/ : /\/$/,
        );
        await expect(dialog(page)).toHaveCount(0);
        expect(await page.evaluate(() => "navigationMarker" in window)).toBe(
          true,
        );
        // Settle two frames: no late focus return pulls focus to the old opener.
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        await expect(opener(page)).not.toBeFocused();
        expect(await menuStateEvents(page)).toEqual([true, false]);
        expect(await background(page)).toMatchObject(released);
      });
    }

    test("a route change while it is open disposes of it and clears the tint state", async ({
      page,
    }) => {
      await page.goto("/");
      await page
        .locator("footer")
        .getByRole("link", { name: "Preise" })
        .click();
      await expect(page).toHaveURL(/\/preise$/);
      await opener(page).click();
      await expect(opener(page)).toHaveAttribute("aria-expanded", "true");
      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(dialog(page)).toHaveCount(0);
      expect(await menuStateEvents(page)).toEqual([true, false]);
      expect(await background(page)).toMatchObject(released);
      // The tint is back at rest: navy once the footer is in view.
      await page.locator("footer").scrollIntoViewIfNeeded();
      await expect(page.locator("#ios-toolbar-tint")).toHaveClass("is-active");
    });

    test("the menu state event fires only on real changes", async ({
      page,
    }) => {
      await page.goto("/");
      await page.setViewportSize({ width: 1280, height: 844 });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await menuStateEvents(page)).toEqual([]);
      await opener(page).click();
      await dialog(page).getByRole("button", { name: "Online lernen" }).click();
      await dialog(page).getByRole("button", { name: "Online lernen" }).click();
      expect(await menuStateEvents(page)).toEqual([true]);
      await closeControl(page).click();
      await expect(dialog(page)).toHaveCount(0);
      expect(await menuStateEvents(page)).toEqual([true, false]);
    });

    test("repeated opening and closing leaves no lock, hidden page or ghost tab stop", async ({
      page,
    }) => {
      await page.goto("/");
      const tabbables = () =>
        page
          .locator(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
          )
          .count();
      const before = {
        ...(await background(page)),
        tabbables: await tabbables(),
      };
      for (let i = 0; i < 4; i++) {
        await opener(page).click();
        await expect(dialog(page)).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog(page)).toHaveCount(0);
        await opener(page).click();
        await closeControl(page).click();
        await expect(dialog(page)).toHaveCount(0);
      }
      await expect(opener(page)).toBeFocused();
      expect({
        ...(await background(page)),
        tabbables: await tabbables(),
      }).toEqual(before);
      await expect(page.locator("body")).not.toHaveAttribute(
        "data-scroll-locked",
      );
      expect(await menuStateEvents(page)).toEqual(
        Array.from({ length: 16 }, (_, i) => i % 2 === 0),
      );
    });
  });

  test("crossing to the desktop breakpoint closes it and keeps focus on a visible header control", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1079, height: 800 });
    await page.goto("/");
    await opener(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText(primaryLabels[0]!);

    await page.setViewportSize({ width: 1080, height: 800 });
    await expect(dialog(page)).toHaveCount(0);
    const banner = page.getByRole("banner");
    const home = banner.getByRole("link", { name: "Startseite" });
    await expect(home).toBeFocused();
    await expect(home).toBeVisible();
    expect(await menuStateEvents(page)).toEqual([true, false]);
    expect(await background(page)).toMatchObject(released);
    // The desktop navigation is usable at once.
    await page.keyboard.press("Tab");
    await expect(
      banner.getByRole("link", { name: primaryLabels[0] }),
    ).toBeFocused();
    await banner.getByRole("button", { name: "Online lernen" }).click();
    await expect(
      page.getByRole("dialog", { name: "Online lernen" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    // Let the popover finish its exit before the resize hides its trigger.
    await expect(page.locator("[role='dialog']")).toHaveCount(0);

    // Back below the breakpoint the menu stays closed until it is opened again.
    await page.setViewportSize({ width: 1079, height: 800 });
    await expect(dialog(page)).toHaveCount(0);
    await expect(opener(page)).toBeVisible();
    expect(await background(page)).toMatchObject(released);
    await opener(page).click();
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(opener(page)).toBeFocused();
    expect(await menuStateEvents(page)).toEqual([true, false, true, false]);
  });
});

test("the desktop navigation marks the current page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/preise");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: "Preise" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test.describe("the desktop platform popover", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const trigger = (page: Page) =>
    page.getByRole("banner").getByRole("button", { name: "Online lernen" });
  const popover = (page: Page) =>
    page.getByRole("dialog", { name: "Online lernen" });

  test("is a named, non-modal dialog of ordinary links", async ({ page }) => {
    await page.goto("/");
    // Radix's modal mode would hide every other child of <body>.
    const hiddenRoots = () =>
      page
        .locator("body > [aria-hidden='true']")
        .evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
    const hiddenBefore = await hiddenRoots();
    await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    const panelId = await trigger(page).getAttribute("aria-controls");
    await expect(popover(page)).toHaveAttribute("id", panelId!);
    await expect(popover(page)).not.toHaveAttribute("aria-modal");
    await expect(popover(page).getByRole("link")).toHaveText([
      /^Discord/,
      /^Microsoft Teams/,
      /^Termin buchen/,
    ]);
    await expect(popover(page).getByRole("menuitem")).toHaveCount(0);
    // Non-modal: the page stays reachable, nothing is hidden, locked or inert.
    expect(await hiddenRoots()).toEqual(hiddenBefore);
    await expect(page.locator("[inert]")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
    await expect(page.locator("body")).toHaveCSS("overflow", "visible");
    await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
    await expect(page.getByRole("main")).toBeVisible();
  });

  for (const key of ["Enter", "Space"]) {
    test(`${key} opens it; Tab passes through and leaves without a trap`, async ({
      page,
    }) => {
      await page.goto("/");
      await trigger(page).focus();
      await page.keyboard.press(key);
      await expect(popover(page)).toBeVisible();
      await expect(trigger(page)).toBeFocused();
      const links = popover(page).getByRole("link");
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press("Tab");
        await expect(links.nth(i)).toBeFocused();
      }
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(trigger(page)).toBeFocused();
      await expect(popover(page)).toBeVisible();
      for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
      await expect(
        page.getByRole("banner").getByRole("link", { name: /Erstgespräch/ }),
      ).toBeFocused();
      await expect(popover(page)).toHaveCount(0);
      await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    });
  }

  test("Shift+Tab from the trigger leaves and closes it", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Kontakt" }),
    ).toBeFocused();
    await expect(popover(page)).toHaveCount(0);
  });

  test("Escape closes it and focuses its trigger", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    // As on main, the links become focusable once the entrance has begun.
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(popover(page).getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger(page)).toBeFocused();
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    // Escape with focus on the trigger closes it as well.
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });

  test("an outside click closes it and keeps the clicked target's focus", async ({
    page,
  }) => {
    await page.goto("/preise");
    await trigger(page).click();
    // A click pins it open after the pointer leaves.
    await page.mouse.move(640, 600);
    await expect(popover(page)).toBeVisible();
    const outside = page.locator("main h3 > button[aria-controls]").first();
    await outside.click();
    await expect(popover(page)).toHaveCount(0);
    await expect(outside).toBeFocused();
    await expect(outside).toHaveAttribute("aria-expanded", "true");
  });

  test("a click on the panel's padding keeps it open and moves no focus there", async ({
    page,
  }) => {
    await page.goto("/");
    await trigger(page).click();
    await expect(trigger(page)).toBeFocused();
    const card = (await popover(page).locator("> div").boundingBox())!;
    // The card's 8px padding, beside the links.
    await page.mouse.click(card.x + 4, card.y + card.height / 2);
    await expect(popover(page)).toBeVisible();
    await expect(popover(page)).toHaveAttribute("data-state", "open");
    // As on main, a click on a non-focusable panel only blurs the trigger.
    expect(
      await page.evaluate(() => document.activeElement === document.body),
    ).toBe(true);
  });

  for (const opening of ["keyboard", "hover"]) {
    test(`a click on plain text outside a ${opening}-opened panel never refocuses the trigger`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      if (opening === "hover") {
        const box = (await trigger(page).boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(popover(page)).toBeVisible();
        await trigger(page).focus();
      } else {
        await trigger(page).focus();
        await page.keyboard.press("Enter");
        await expect(popover(page)).toBeVisible();
      }
      await page.keyboard.press("Tab");
      await expect(popover(page).getByRole("link").first()).toBeFocused();
      // The pointer leaves the panel on its way (a hover close), then clicks text.
      const text = page.getByRole("main").locator("p").first();
      await text.click({ position: { x: 2, y: 2 } });
      await expect(page.locator("[role='dialog']")).toHaveCount(0);
      await page.waitForTimeout(100);
      expect(
        await page.evaluate(() => document.activeElement === document.body),
      ).toBe(true);
      await expect(trigger(page)).not.toBeFocused();
    });
  }

  // Like CSS :hover under (hover: hover) on main: a pen hovers, a touch does not.
  for (const [pointerType, opens] of [
    ["pen", true],
    ["touch", false],
  ] as const) {
    test(`a ${pointerType} hover ${opens ? "opens" : "does not open"} it`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      // React derives enter/leave from `pointerout`: from "Kontakt" onto the trigger.
      const kontakt = page
        .getByRole("banner")
        .getByRole("link", { name: "Kontakt" });
      await kontakt.evaluate(
        (node, [type, target]) => {
          node.dispatchEvent(
            new PointerEvent("pointerout", {
              bubbles: true,
              pointerType: type,
              relatedTarget: target,
            }),
          );
        },
        [pointerType, await trigger(page).elementHandle()] as const,
      );
      if (opens) await expect(popover(page)).toBeVisible();
      else {
        await page.waitForTimeout(300);
        await expect(page.locator("[role='dialog']")).toHaveCount(0);
      }
    });
  }

  test("hover opens it without moving focus; the pointer crosses to the panel", async ({
    page,
  }) => {
    await page.goto("/");
    const home = page
      .getByRole("banner")
      .getByRole("link", { name: "Startseite" });
    await home.focus();
    const box = (await trigger(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(popover(page)).toBeVisible();
    await expect(home).toBeFocused();
    // Down through the gap below the trigger onto the last link.
    const last = (await popover(page).getByRole("link").last().boundingBox())!;
    await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, {
      steps: 12,
    });
    await expect(popover(page)).toBeVisible();
    await expect(home).toBeFocused();
    await page.mouse.move(box.x - 200, 600, { steps: 4 });
    await expect(popover(page)).toHaveCount(0);
    await expect(home).toBeFocused();
  });

  test("after Escape a hovered trigger stays closed until the pointer leaves or the trigger is used", async ({
    page,
  }) => {
    await page.goto("/");
    const box = (await trigger(page).boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    await page.mouse.move(centre.x + 6, centre.y + 2, { steps: 3 });
    await page.waitForTimeout(400);
    await expect(popover(page)).toHaveCount(0);
    // A click is a deliberate reopen.
    await page.mouse.click(centre.x, centre.y);
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    // So is a fresh hover after the pointer left.
    await page.mouse.move(centre.x, 400, { steps: 3 });
    await page.mouse.move(centre.x, centre.y, { steps: 3 });
    await expect(popover(page)).toBeVisible();
  });

  test("a click on the open trigger closes it, and hover does not reopen it", async ({
    page,
  }) => {
    await page.goto("/");
    await trigger(page).click();
    await expect(popover(page)).toBeVisible();
    await trigger(page).click();
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await page.waitForTimeout(400);
    await expect(popover(page)).toHaveCount(0);
  });

  test("rapid toggling settles on one consistent panel", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
    }
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await expect(page.locator("[role='dialog']")).toHaveCount(1);
    await expect(page.locator("[inert]")).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });

  test("a link navigates on the client and closes it", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      Object.assign(window, { navigationMarker: true }),
    );
    await trigger(page).click();
    await popover(page)
      .getByRole("link", { name: /^Termin buchen/ })
      .click();
    await expect(page).toHaveURL(/\/termin$/);
    await expect(popover(page)).toHaveCount(0);
    expect(await page.evaluate(() => "navigationMarker" in window)).toBe(true);
    await trigger(page).click();
    await expect(
      popover(page).getByRole("link", { name: /^Termin buchen/ }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("a section link jumps on the page, closes it and is never current", async ({
    page,
  }) => {
    await page.goto("/online-lernen");
    await page.evaluate(() =>
      Object.assign(window, { navigationMarker: true }),
    );
    await trigger(page).click();
    const links = popover(page).getByRole("link");
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(links.nth(1)).not.toHaveAttribute("aria-current");
    await links.nth(1).click();
    await expect(page).toHaveURL(/\/online-lernen#ms-teams$/);
    await expect(popover(page)).toHaveCount(0);
    expect(await page.evaluate(() => "navigationMarker" in window)).toBe(true);
  });
});

test("the duration select is named", async ({ page }) => {
  await stubAvailability(page);
  await page.goto("/termin");
  await expect(
    page.getByRole("button", { name: /^Dauer: \d+ Minuten$/ }),
  ).toBeVisible();
});

test("the Discord buttons are named by their text only", async ({ page }) => {
  await page.goto("/online-lernen");
  await expect(
    page.getByRole("link", { name: "Server beitreten", exact: true }),
  ).toHaveCount(2);
});

for (const path of indexablePaths) {
  test(`the heading outline of ${path} never skips a level`, async ({
    page,
  }) => {
    await page.goto(path);
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((headings) =>
        headings.map((heading) => Number(heading.tagName.slice(1))),
      );
    expect(levels[0], "the first heading is the h1").toBe(1);
    levels.forEach((level, i) => {
      if (i > 0)
        expect(
          level,
          `heading ${i + 1} of ${levels.length}`,
        ).toBeLessThanOrEqual(levels[i - 1]! + 1);
    });
  });
}
