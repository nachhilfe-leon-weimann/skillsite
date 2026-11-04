import { expect, test, type Page } from "@playwright/test";

import {
  freezeTime,
  interceptSubmissions,
  isolate,
  settledRequests,
  stubAvailability,
  stubMonths,
} from "./helpers";
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

    // Where a menu link leaves focus: on <body>, with the sequential focus start
    // point at the removed link in the dialog (end of <body>), so the next Tab
    // reaches the skip link - or, for a fragment, the target's next control.
    for (const { from, target, to, nextTab } of [
      {
        from: "/",
        target: "Preise",
        to: /\/preise$/,
        nextTab: "Zum Inhalt springen",
      },
      {
        from: "/preise",
        target: "Startseite",
        to: /\/$/,
        nextTab: "Zum Inhalt springen",
      },
      {
        from: "/",
        target: primaryCta.label,
        to: /\/kontakt#kennenlernen$/,
        nextTab: "Direkt anfragen",
      },
      {
        from: "/",
        target: "Discord",
        to: /\/online-lernen$/,
        nextTab: "Zum Inhalt springen",
      },
      {
        from: "/preise",
        target: "Preise",
        to: /\/preise$/,
        nextTab: "Zum Inhalt springen",
      },
    ]) {
      test(`the ${target} link from ${from} navigates on the client, closes it and leaves focus to the destination`, async ({
        page,
      }) => {
        await page.goto(from);
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
        await expect(page).toHaveURL(to);
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
        expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
          "BODY",
        );
        await page.keyboard.press("Tab");
        await expect(page.locator(":focus")).toHaveAccessibleName(nextTab);
        await expect(page.locator(":focus")).toBeVisible();
        expect(await menuStateEvents(page)).toEqual([true, false]);
        expect(await background(page)).toMatchObject(released);
      });
    }

    for (const key of ["Enter", "click"]) {
      test(`the home link on the home page (${key}) closes it and keeps focus on the header's home link, as on main`, async ({
        page,
      }) => {
        await page.goto("/");
        await opener(page).click();
        const menuHome = dialog(page).getByRole("link", { name: "Startseite" });
        if (key === "Enter") {
          await menuHome.focus();
          await page.keyboard.press("Enter");
        } else await menuHome.click();
        await expect(dialog(page)).toHaveCount(0);
        const home = page
          .getByRole("banner")
          .getByRole("link", { name: "Startseite" });
        await expect(home).toBeFocused();
        await expect(home).toBeVisible();
        await page.keyboard.press("Tab");
        await expect(opener(page)).toBeFocused();
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

test.describe("the booking choices", () => {
  /**
   * Abort every request that is not a GET (the booking server action is a
   * POST) before it leaves the browser, and record its body. No booking is sent.
   */
  async function holdSubmissions(page: Page) {
    const bodies: string[] = [];
    await page.route("**/*", (route) => {
      if (route.request().method() === "GET") return route.fallback();
      bodies.push(route.request().postData() ?? "");
      return route.abort();
    });
    return bodies;
  }

  async function openForm(page: Page, path: string) {
    await stubAvailability(page);
    const bodies = await holdSubmissions(page);
    await page.goto(path);
    await page.getByRole("button", { name: "10:00" }).click();
    await expect(page.getByText("Deine Daten")).toBeVisible();
    return bodies;
  }

  const radio = (page: Page, name: string) =>
    page.getByRole("radio", { name, exact: true });
  const chip = (page: Page, name: string) =>
    page.getByRole("button", { name, exact: true });
  const openItems = (page: Page) =>
    page.getByText("Bitte noch ausfüllen oder bestätigen:");

  /** The focused radio is the checked one, and the only one in its group. */
  async function expectFocusedAndChecked(page: Page, name: string) {
    const element = radio(page, name);
    await expect(element).toBeFocused();
    await expect(element).toHaveAttribute("aria-checked", "true");
    expect(
      await element.evaluate(
        (node) =>
          node
            .closest("[role=radiogroup]")!
            .querySelectorAll("[role=radio][aria-checked=true]").length,
      ),
    ).toBe(1);
  }

  /** The scroll position once a smooth scroll has come to rest. */
  async function settledScroll(page: Page) {
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

  /** Synthetic data only. */
  async function fillContact(page: Page) {
    await page.getByRole("textbox", { name: "Vorname" }).fill("Erika");
    await page.getByRole("textbox", { name: "Nachname" }).fill("Beispiel");
    await page
      .getByRole("textbox", { name: "E-Mail" })
      .fill("erika@example.com");
  }

  /** The draft the aborted server action carried. */
  function draftValues(body: string) {
    const draft = (
      JSON.parse(body) as { values: Record<string, unknown> }[]
    )[0]!;
    return draft.values;
  }

  test("/termin: platform rows and subject chips are named radio groups with one tab stop each", async ({
    page,
  }) => {
    const bodies = await openForm(page, "/termin");
    const platform = page.getByRole("radiogroup", { name: "Plattform" });
    const subject = page.getByRole("radiogroup", {
      name: "In welchem Fach kann ich dir helfen?",
    });
    await expect(platform).toHaveAttribute("aria-required", "true");
    await expect(subject).toHaveAttribute("aria-required", "true");
    await expect(platform.getByRole("radio")).toHaveText([
      "Microsoft Teams",
      "Discord",
    ]);
    await expect(subject.getByRole("radio")).toHaveText([
      "Mathematik",
      "Informatik",
      "Physik",
    ]);
    // The platform is preselected by the form; the subject starts empty.
    await expect(radio(page, "Microsoft Teams")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(subject.locator("[aria-checked=true]")).toHaveCount(0);

    const email = page.getByRole("textbox", { name: "E-Mail" });
    const note = page.getByRole("textbox", { name: "Zusätzliche Notizen" });
    await email.focus();
    await page.keyboard.press("Tab");
    await expectFocusedAndChecked(page, "Microsoft Teams");
    await page.keyboard.press("Tab");
    await expect(radio(page, "Mathematik")).toBeFocused();
    await expect(radio(page, "Mathematik")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await page.keyboard.press("Tab");
    await expect(note).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(radio(page, "Mathematik")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(radio(page, "Microsoft Teams")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(email).toBeFocused();
    expect(bodies).toEqual([]);
  });

  test("/termin: arrows move focus and choice together; the checked chip stays; the open items follow", async ({
    page,
  }) => {
    const bodies = await openForm(page, "/termin");
    await expect(openItems(page)).toContainText("Fach");

    await radio(page, "Microsoft Teams").focus();
    const scroll = await settledScroll(page);
    await page.keyboard.press("ArrowDown");
    await expectFocusedAndChecked(page, "Discord");
    await page.keyboard.press("ArrowDown");
    await expectFocusedAndChecked(page, "Microsoft Teams");
    await page.keyboard.press("ArrowUp");
    await expectFocusedAndChecked(page, "Discord");
    expect(await settledScroll(page)).toBe(scroll);

    await page.keyboard.press("Tab");
    await expect(radio(page, "Mathematik")).toBeFocused();
    await page.keyboard.press("Space");
    await expectFocusedAndChecked(page, "Mathematik");
    await expect(openItems(page)).not.toContainText("Fach");
    // Before, Space or Enter on the checked chip cleared the subject again.
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await expectFocusedAndChecked(page, "Mathematik");
    await expect(openItems(page)).not.toContainText("Fach");
    await page.keyboard.press("ArrowRight");
    await expectFocusedAndChecked(page, "Informatik");
    await page.keyboard.press("End");
    await expectFocusedAndChecked(page, "Physik");
    await page.keyboard.press("Home");
    await expectFocusedAndChecked(page, "Mathematik");
    // A click on the checked chip keeps it, too.
    await radio(page, "Mathematik").click();
    await expect(radio(page, "Mathematik")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(bodies).toEqual([]);
  });

  test("/termin: quick and held keys keep focus and the checked chip in sync", async ({
    page,
  }) => {
    await openForm(page, "/termin");
    await radio(page, "Mathematik").focus();
    await page.keyboard.press("Space");
    // Pressed and released in one task, before Radix's deferred focus runs.
    for (const name of ["Informatik", "Physik", "Mathematik"]) {
      await page.evaluate(() => {
        const target = document.activeElement!;
        for (const type of ["keydown", "keyup"])
          target.dispatchEvent(
            new KeyboardEvent(type, {
              key: "ArrowRight",
              bubbles: true,
              cancelable: true,
            }),
          );
      });
      await expectFocusedAndChecked(page, name);
    }
    // Held: repeated keydowns, one keyup.
    for (const name of ["Informatik", "Physik", "Mathematik"]) {
      await page.keyboard.down("ArrowRight");
      await expectFocusedAndChecked(page, name);
    }
    await page.keyboard.up("ArrowRight");
    await expectFocusedAndChecked(page, "Mathematik");
  });

  test("/termin: no choice submits the form; the draft carries strings", async ({
    page,
  }) => {
    const bodies = await openForm(page, "/termin");
    await fillContact(page);
    await radio(page, "Physik").click();
    const submit = page.getByRole("button", {
      name: "Zahlungspflichtig buchen",
    });
    await expect(submit).toBeEnabled();
    // Every key on a choice, with the form complete: nothing is sent.
    await radio(page, "Microsoft Teams").focus();
    for (const key of ["Enter", "Space", "ArrowDown", "Enter"])
      await page.keyboard.press(key);
    await radio(page, "Physik").focus();
    for (const key of ["Enter", "Space", "ArrowLeft", "ArrowRight", "Enter"])
      await page.keyboard.press(key);
    // Keys pressed this fast may start from the same radio, and Radix's
    // deferred focus may even return to the platform rows; wherever focus
    // lands, it is on the checked radio.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const focused = document.activeElement!;
          return (
            focused.getAttribute("role") === "radio" &&
            focused.getAttribute("aria-checked") === "true"
          );
        }),
      )
      .toBe(true);
    await page.waitForLoadState("networkidle");
    expect(bodies).toEqual([]);
    await radio(page, "Physik").click();

    // The submit button sends one draft (aborted before it leaves the browser).
    await submit.click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(draftValues(bodies[0]!)).toMatchObject({
      location: "discord-video",
      subject: "Physik",
    });
  });

  test("/kontakt: subject chips are independent pressed toggles; the open items follow; the draft keeps their order", async ({
    page,
  }) => {
    const bodies = await openForm(page, "/kontakt");
    const group = page.getByRole("group", { name: "Fächer" });
    await expect(group.getByRole("button")).toHaveText([
      "Mathematik",
      "Informatik",
      "Physik",
    ]);
    for (const button of await group.getByRole("button").all())
      await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(openItems(page)).toContainText("Fächer");

    // Each chip is a tab stop, as before.
    await page.getByRole("textbox", { name: "Telefonnummer" }).focus();
    for (const name of ["Mathematik", "Informatik", "Physik"]) {
      await page.keyboard.press("Tab");
      await expect(chip(page, name)).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("textbox", { name: "Worum geht’s?" }),
    ).toBeFocused();

    await chip(page, "Physik").focus();
    await page.keyboard.press("Space");
    await expect(chip(page, "Physik")).toHaveAttribute("aria-pressed", "true");
    await expect(openItems(page)).not.toContainText("Fächer");
    // Arrow keys do not move between toggles.
    await page.keyboard.press("ArrowLeft");
    await expect(chip(page, "Physik")).toBeFocused();
    await chip(page, "Mathematik").focus();
    await page.keyboard.press("Enter");
    await expect(chip(page, "Mathematik")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("Space");
    await expect(chip(page, "Mathematik")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await chip(page, "Physik").click();
    await expect(chip(page, "Physik")).toHaveAttribute("aria-pressed", "false");
    await expect(openItems(page)).toContainText("Fächer");

    await fillContact(page);
    await page
      .getByRole("textbox", { name: "Telefonnummer" })
      .fill("+49 30 1234567");
    await chip(page, "Physik").click();
    await chip(page, "Mathematik").click();
    await page.waitForLoadState("networkidle");
    expect(bodies).toEqual([]);
    await page.getByRole("button", { name: "Erstgespräch buchen" }).click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(draftValues(bodies[0]!)).toMatchObject({
      subjects: ["Physik", "Mathematik"],
    });
  });

  test("/kontakt?fach= preselects its subject chip", async ({ page }) => {
    await openForm(page, "/kontakt?fach=informatik");
    await expect(chip(page, "Informatik")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(chip(page, "Mathematik")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

test.describe("the duration select", () => {
  /** The `duration` of every availability request, in order. */
  function recordDurations(page: Page) {
    const durations: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/booking/availability")
        durations.push(url.searchParams.get("duration") ?? "");
    });
    return durations;
  }

  test("is a combobox named Dauer that shows its value", async ({ page }) => {
    await stubAvailability(page);
    await page.goto("/termin");
    const select = page.getByRole("combobox", { name: "Dauer", exact: true });
    await expect(select).toBeVisible();
    await expect(select).toHaveText("60 Minuten");
    await expect(select).toHaveAttribute("aria-expanded", "false");
  });

  test("the keyboard picks a duration that the next availability request carries", async ({
    page,
  }) => {
    await stubAvailability(page);
    const durations = recordDurations(page);
    await page.goto("/termin");
    await expect(page.getByRole("button", { name: "10:00" })).toBeVisible();
    expect(durations).toEqual(["60"]);
    const select = page.getByRole("combobox", { name: "Dauer", exact: true });
    await select.focus();
    await page.keyboard.press("Enter");
    const list = page.getByRole("listbox", { name: "Dauer", exact: true });
    await expect(
      list.getByRole("option", { name: "60 Minuten", selected: true }),
    ).toBeFocused();
    await expect(list.getByRole("option")).toHaveText([
      "45 Minuten",
      "60 Minuten",
      "90 Minuten",
    ]);
    // While open, Tab stays in the list.
    await page.keyboard.press("Tab");
    await expect(
      list.getByRole("option", { name: "60 Minuten" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      list.getByRole("option", { name: "90 Minuten" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(list).toHaveCount(0);
    await expect(select).toBeFocused();
    await expect(select).toHaveText("90 Minuten");
    await expect.poll(() => durations).toEqual(["60", "90"]);
    // Escape keeps the value and asks for nothing.
    await page.keyboard.press("ArrowDown");
    await expect(
      list.getByRole("option", { name: "90 Minuten" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(
      list.getByRole("option", { name: "60 Minuten" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(select).toBeFocused();
    await expect(select).toHaveText("90 Minuten");
    await page.waitForLoadState("networkidle");
    expect(durations).toEqual(["60", "90"]);
  });

  test("is disabled once a slot is chosen", async ({ page }) => {
    await stubAvailability(page);
    await page.goto("/termin");
    await page.getByRole("button", { name: "10:00" }).click();
    await expect(
      page.getByRole("combobox", { name: "Dauer", exact: true }),
    ).toBeDisabled();
  });
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

/*
 * The C8 widgets together, by keyboard: navigation into the booking routes,
 * duration, calendar, slots and form up to its validation, one overlay at a
 * time, and client navigation between the booking routes. Availability and the
 * clock are stubbed; every server action is held in the browser, so nothing
 * is booked.
 */
test.describe("the integrated keyboard paths", () => {
  /** 2026-11-04 12:00 in Berlin: a slot up to 18 November needs the withdrawal consent. */
  const NOVEMBER = new Date("2026-11-04T11:00:00Z");
  const FREE_DAYS = { "2026-11": ["2026-11-05", "2026-11-12"] };

  async function openBooker(page: Page, path: string) {
    await freezeTime(page, NOVEMBER);
    const stub = await stubMonths(page, FREE_DAYS);
    const submissions = await interceptSubmissions(page);
    await page.goto(path);
    await expect(page.getByRole("grid")).toHaveAccessibleName("November 2026");
    return { stub, submissions };
  }

  const focused = (page: Page) => page.locator(":focus");
  const duration = (page: Page) =>
    page.getByRole("combobox", { name: "Dauer", exact: true });
  const nextMonth = (page: Page) =>
    page.getByRole("button", { name: "Nächster Monat" });
  const previousMonth = (page: Page) =>
    page.getByRole("button", { name: "Vorheriger Monat" });
  const gridStop = (page: Page) =>
    page.getByRole("grid").locator('button[tabindex="0"]');
  const slot = (page: Page) => page.getByRole("button", { name: "10:00 Uhr" });
  const back = (page: Page) =>
    page.getByRole("button", { name: "Zurück zur Terminwahl" });
  const openItems = (page: Page) =>
    page.getByText("Bitte noch ausfüllen oder bestätigen:");
  const textbox = (page: Page, name: string) =>
    page.getByRole("textbox", { name, exact: true });
  const radio = (page: Page, name: string) =>
    page.getByRole("radio", { name, exact: true });
  const navTrigger = (page: Page) =>
    page.getByRole("banner").getByRole("button", { name: "Online lernen" });
  const platformPopover = (page: Page) =>
    page.getByRole("dialog", { name: "Online lernen" });

  /** What an open overlay may leave on the page: guards, locks, hidden or inert content. */
  const overlayLeftovers = (page: Page) =>
    page.evaluate(() => ({
      dialogs: document.querySelectorAll("[role=dialog]").length,
      listboxes: document.querySelectorAll("[role=listbox]").length,
      focusGuards: document.querySelectorAll("[data-radix-focus-guard]").length,
      scrollLocked: document.body.hasAttribute("data-scroll-locked"),
      bodyPointerEvents: document.body.style.pointerEvents,
      hidden: document.querySelectorAll("[data-aria-hidden], [inert]").length,
    }));
  const noOverlay = {
    dialogs: 0,
    listboxes: 0,
    focusGuards: 0,
    scrollLocked: false,
    bodyPointerEvents: "",
    hidden: 0,
  };

  async function press(page: Page, key: string) {
    await page.keyboard.press(key);
  }

  /** From the focused duration: open the list, move down to `label` and commit it. */
  async function chooseDuration(page: Page, label: string) {
    await expect(duration(page)).toBeFocused();
    await press(page, "Enter");
    const list = page.getByRole("listbox", { name: "Dauer", exact: true });
    await expect(list.getByRole("option", { selected: true })).toBeFocused();
    await press(page, "ArrowDown");
    await expect(list.getByRole("option", { name: label })).toBeFocused();
    await press(page, "Enter");
    await expect(list).toHaveCount(0);
    await expect(duration(page)).toBeFocused();
    await expect(duration(page)).toHaveText(label);
  }

  for (const width of [390, 1280]) {
    test.describe(`at ${width}px`, () => {
      test.use({ viewport: { width, height: 844 } });

      test("/termin: the keyboard runs from the duration through calendar, slot and form to a valid form; nothing is sent", async ({
        page,
      }) => {
        const { stub, submissions } = await openBooker(page, "/termin");
        await expect(gridStop(page)).toHaveAccessibleName(
          "Donnerstag, 5. November 2026, ausgewählt",
        );

        // The skip link leads into the page; the booking card starts at the duration.
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName("Zum Inhalt springen");
        await press(page, "Enter");
        await press(page, "Tab");
        await expect(duration(page)).toBeFocused();

        // Duration: 90 minutes by keyboard, asked for once.
        await chooseDuration(page, "90 Minuten");
        await expect(gridStop(page)).toHaveAccessibleName(/5\. November/);

        // Tab order: the next month (the previous one is disabled at the
        // window's start), the grid's single stop, the day's slot, and back.
        await expect(previousMonth(page)).toBeDisabled();
        await press(page, "Tab");
        await expect(nextMonth(page)).toBeFocused();
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(
          "Donnerstag, 5. November 2026, ausgewählt",
        );
        await press(page, "Tab");
        await expect(slot(page)).toBeFocused();
        await press(page, "Shift+Tab");
        await expect(gridStop(page)).toBeFocused();

        // A week down, then Enter picks the 12th and shows its slot.
        await press(page, "ArrowDown");
        await expect(focused(page)).toHaveAccessibleName(
          "Donnerstag, 12. November 2026",
        );
        await press(page, "Enter");
        await expect(focused(page)).toHaveAccessibleName(
          "Donnerstag, 12. November 2026, ausgewählt",
        );
        await expect(page.getByText("Do., 12. November")).toBeVisible();
        await press(page, "Tab");
        await expect(slot(page)).toBeFocused();
        await press(page, "Enter");
        await expect(page.getByText("Deine Daten")).toBeVisible();
        await expect(duration(page)).toBeDisabled();
        await expect(
          page.getByText("Do., 12. November – 10:00 Uhr").first(),
        ).toBeVisible();

        // The form, in order; the open items follow every field.
        const submit = page.getByRole("button", {
          name: "Zahlungspflichtig buchen",
        });
        await press(page, "Tab");
        await expect(back(page)).toBeFocused();
        await press(page, "Tab");
        await expect(textbox(page, "Vorname")).toBeFocused();
        await page.keyboard.type("Erika");
        await press(page, "Tab");
        await expect(textbox(page, "Nachname")).toBeFocused();
        await press(page, "Tab");
        await expect(textbox(page, "E-Mail")).toBeFocused();
        // Left empty, the required field is marked invalid.
        await expect(textbox(page, "Nachname")).toHaveAttribute(
          "aria-invalid",
          "true",
        );
        await page.keyboard.type("erika@example");
        await expect(openItems(page)).toHaveText(
          "Bitte noch ausfüllen oder bestätigen: Nachname, E-Mail, Fach, Widerrufshinweis",
        );
        await expect(submit).toBeDisabled();
        await page.keyboard.type(".com");
        await expect(openItems(page)).toHaveText(
          "Bitte noch ausfüllen oder bestätigen: Nachname, Fach, Widerrufshinweis",
        );
        await press(page, "Shift+Tab");
        await expect(textbox(page, "Nachname")).toBeFocused();
        await page.keyboard.type("Beispiel");
        await expect(textbox(page, "Nachname")).not.toHaveAttribute(
          "aria-invalid",
        );
        await press(page, "Tab");
        await press(page, "Tab");
        await expect(radio(page, "Microsoft Teams")).toBeFocused();
        await press(page, "ArrowDown");
        await expect(radio(page, "Discord")).toBeFocused();
        await expect(radio(page, "Discord")).toHaveAttribute(
          "aria-checked",
          "true",
        );
        await press(page, "Tab");
        await expect(radio(page, "Mathematik")).toBeFocused();
        await press(page, "Space");
        await expect(radio(page, "Mathematik")).toHaveAttribute(
          "aria-checked",
          "true",
        );
        await expect(openItems(page)).toHaveText(
          "Bitte noch ausfüllen oder bestätigen: Widerrufshinweis",
        );
        await press(page, "Tab");
        await expect(
          page.getByRole("textbox", { name: "Zusätzliche Notizen" }),
        ).toBeFocused();
        await page.keyboard.type("Synthetische Notiz");
        await press(page, "Tab");
        const consent = page.getByRole("checkbox", { name: /Widerrufsfrist/ });
        await expect(consent).toBeFocused();
        await expect(submit).toBeDisabled();
        await press(page, "Space");
        await expect(consent).toBeChecked();
        await expect(openItems(page)).toHaveCount(0);
        await expect(submit).toBeEnabled();
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName("AGB");
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(
          "Datenschutzerklärung",
        );
        await press(page, "Tab");
        await expect(submit).toBeFocused();

        // Back to the calendar: the day stays picked, the duration is free again.
        await back(page).focus();
        await press(page, "Enter");
        await expect(gridStop(page)).toHaveAccessibleName(
          "Donnerstag, 12. November 2026, ausgewählt",
        );
        await expect(duration(page)).toBeEnabled();
        await expect(duration(page)).toHaveText("90 Minuten");
        await press(page, "Tab");
        await expect(nextMonth(page)).toBeFocused();

        expect(await settledRequests(page, stub.requests)).toEqual([
          "2026-11@60",
          "2026-11@90",
        ]);
        expect(submissions.bodies).toEqual([]);
      });

      test("/kontakt: the keyboard runs through calendar, slot and form to a valid form; nothing is sent", async ({
        page,
      }) => {
        const { stub, submissions } = await openBooker(page, "/kontakt");
        // A fixed duration: no combobox, the duration is plain text.
        await expect(page.getByRole("combobox")).toHaveCount(0);
        await expect(page.getByText("15 Minuten")).toBeVisible();

        // From the page start, Tab reaches the month buttons, then the grid.
        let stops = 0;
        while (
          !(await nextMonth(page).evaluate((n) => n === document.activeElement))
        ) {
          await press(page, "Tab");
          expect(++stops, "Tab stops before the calendar").toBeLessThan(60);
        }
        await expect(previousMonth(page)).toBeDisabled();
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(
          "Donnerstag, 5. November 2026, ausgewählt",
        );
        // Space picks a day as well.
        await press(page, "ArrowDown");
        await press(page, "Space");
        await expect(focused(page)).toHaveAccessibleName(
          "Donnerstag, 12. November 2026, ausgewählt",
        );
        await press(page, "Tab");
        await expect(slot(page)).toBeFocused();
        await press(page, "Enter");
        await expect(page.getByText("Deine Daten")).toBeVisible();

        const submit = page.getByRole("button", {
          name: "Erstgespräch buchen",
        });
        await press(page, "Tab");
        await expect(back(page)).toBeFocused();
        for (const [name, text] of [
          ["Vorname", "Erika"],
          ["Nachname", "Beispiel"],
          ["E-Mail", "erika@example.com"],
          ["Telefonnummer", "12"],
        ] as const) {
          await press(page, "Tab");
          await expect(textbox(page, name)).toBeFocused();
          await page.keyboard.type(text);
        }
        // Too short a number is still open, as is a subject.
        await expect(openItems(page)).toHaveText(
          "Bitte noch ausfüllen oder bestätigen: Telefonnummer, Fächer",
        );
        await page.keyboard.type("34567");
        await expect(openItems(page)).toHaveText(
          "Bitte noch ausfüllen oder bestätigen: Fächer",
        );
        await expect(submit).toBeDisabled();
        // Each chip is a tab stop and toggles by Space or Enter.
        const chip = (name: string) =>
          page.getByRole("button", { name, exact: true });
        await press(page, "Tab");
        await expect(chip("Mathematik")).toBeFocused();
        await press(page, "Space");
        await expect(chip("Mathematik")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await press(page, "Tab");
        await press(page, "Tab");
        await expect(chip("Physik")).toBeFocused();
        await press(page, "Enter");
        await expect(chip("Physik")).toHaveAttribute("aria-pressed", "true");
        await expect(openItems(page)).toHaveCount(0);
        await expect(submit).toBeEnabled();
        await press(page, "Tab");
        await expect(
          page.getByRole("textbox", { name: "Worum geht’s?" }),
        ).toBeFocused();
        await press(page, "Tab");
        await expect(submit).toBeFocused();

        expect(await settledRequests(page, stub.requests)).toEqual([
          "2026-11@15",
        ]);
        expect(submissions.bodies).toEqual([]);
      });
    });
  }

  test.describe("at 1280px", () => {
    test.use({ viewport: { width: 1280, height: 844 } });

    test("/termin: a held submission shows its pending state, a failed request its error; retry and a new choice work by keyboard", async ({
      page,
    }) => {
      const { stub, submissions } = await openBooker(page, "/termin");
      await duration(page).focus();
      await chooseDuration(page, "90 Minuten");
      await gridStop(page).focus();
      await press(page, "ArrowDown");
      await press(page, "Enter");
      await press(page, "Tab");
      await expect(slot(page)).toBeFocused();
      await press(page, "Enter");
      await textbox(page, "Vorname").fill("Erika");
      await textbox(page, "Nachname").fill("Beispiel");
      await textbox(page, "E-Mail").fill("erika@example.com");
      await radio(page, "Microsoft Teams").focus();
      await press(page, "ArrowDown");
      // Radix moves focus a task after the key; let it land before focusing elsewhere.
      await expect(radio(page, "Discord")).toBeFocused();
      await radio(page, "Mathematik").focus();
      await press(page, "End");
      await expect(radio(page, "Physik")).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await page.getByRole("checkbox", { name: /Widerrufsfrist/ }).check();
      const submit = page.getByRole("button", {
        name: "Zahlungspflichtig buchen",
      });
      await submit.focus();
      await press(page, "Enter");

      // Pending while the server action is held in the browser.
      await expect(page.getByText("Termin wird gebucht …")).toBeVisible();
      await expect(
        page.getByText("Einen Moment – die Buchung wird bestätigt."),
      ).toHaveAttribute("aria-live", "polite");
      await expect.poll(() => submissions.held()).toBe(1);
      expect(submissions.actions).toEqual([true]);
      // The draft carries what the keyboard chose in every widget.
      const draft = (JSON.parse(submissions.bodies[0]!) as object[])[0];
      expect(draft).toMatchObject({
        event: "nachhilfe",
        duration: 90,
        slot: "2026-11-12T10:00:00.000+01:00",
        values: { location: "discord-video", subject: "Physik" },
        agreements: { termsAccepted: true, earlyPerformanceRequested: true },
      });

      // A request that fails before any answer is a visible error.
      await submissions.abort();
      await expect(
        page.getByRole("heading", { name: "Das hat nicht ganz geklappt" }),
      ).toBeVisible();
      await expect(
        page.getByText("Die Buchung hat nicht geklappt."),
      ).toBeVisible();
      const resend = page.getByRole("button", { name: "Erneut senden" });
      await resend.focus();
      await press(page, "Enter");
      await expect(page.getByText("Termin wird gebucht …")).toBeVisible();
      await expect.poll(() => submissions.held()).toBe(1);
      expect(submissions.actions).toEqual([true, true]);
      await submissions.abort();
      await expect(resend).toBeVisible();

      // A new choice returns to the calendar and asks for the month again.
      await page.getByRole("button", { name: "Anderen Termin wählen" }).focus();
      await press(page, "Enter");
      await expect(gridStop(page)).toHaveAccessibleName(
        "Donnerstag, 5. November 2026, ausgewählt",
      );
      await expect(duration(page)).toBeEnabled();
      await expect(duration(page)).toHaveText("90 Minuten");
      expect(await settledRequests(page, stub.requests)).toEqual([
        "2026-11@60",
        "2026-11@90",
        "2026-11@90",
      ]);
      expect(submissions.held()).toBe(0);
      expect(submissions.bodies).toHaveLength(2);
    });

    test("from the page start, the platform links open /termin on the client, and the next Tab reaches the booking card", async ({
      page,
    }) => {
      await freezeTime(page, NOVEMBER);
      await stubMonths(page, FREE_DAYS);
      await page.goto("/");
      await page.evaluate(() =>
        Object.assign(window, { navigationMarker: true }),
      );
      const stops: string[] = [];
      for (let i = 0; i < 2 + primaryLabels.length + 1; i++) {
        await press(page, "Tab");
        stops.push(
          await page.evaluate(() => {
            const element = document.activeElement;
            return (
              element?.getAttribute("aria-label") ??
              element?.textContent?.trim() ??
              ""
            );
          }),
        );
      }
      expect(stops).toEqual([
        "Zum Inhalt springen",
        "Startseite",
        ...primaryLabels,
        "Online lernen",
      ]);
      await expect(navTrigger(page)).toBeFocused();
      await press(page, "Enter");
      await expect(platformPopover(page)).toBeVisible();
      const links = platformPopover(page).getByRole("link");
      for (let i = 0; i < 3; i++) {
        await press(page, "Tab");
        await expect(links.nth(i)).toBeFocused();
      }
      await expect(links.nth(2)).toHaveAccessibleName(/^Termin buchen/);
      await press(page, "Enter");
      await expect(page).toHaveURL(/\/termin$/);
      expect(await page.evaluate(() => "navigationMarker" in window)).toBe(
        true,
      );
      await expect(platformPopover(page)).toHaveCount(0);
      await expect(navTrigger(page)).toHaveAttribute("aria-expanded", "false");
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);
      await press(page, "Tab");
      await expect(duration(page)).toBeFocused();
      await press(page, "Enter");
      await expect(
        page.getByRole("listbox", { name: "Dauer", exact: true }),
      ).toBeVisible();
      await press(page, "Escape");
      await expect(duration(page)).toBeFocused();
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);
    });

    test("/termin: the platform popover and the duration list are never open together", async ({
      page,
    }) => {
      await openBooker(page, "/termin");
      // The banner is hidden from AT while the list is open; find the trigger by its markup then.
      const trigger = page.locator("header button[aria-haspopup=dialog]");
      const list = page.getByRole("listbox", { name: "Dauer", exact: true });

      // A pinned popover closes when the pointer opens the list.
      await navTrigger(page).click();
      await page.mouse.move(640, 700);
      await expect(platformPopover(page)).toBeVisible();
      await duration(page).click();
      await expect(list).toBeVisible();
      await expect(page.locator("[role=dialog]")).toHaveCount(0);
      // While the list is open, hovering the trigger opens nothing.
      const box = (await trigger.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(400);
      await expect(page.locator("[role=dialog]")).toHaveCount(0);
      await page.mouse.move(640, 700, { steps: 3 });
      await press(page, "Escape");
      await expect(list).toHaveCount(0);
      await expect(duration(page)).toBeFocused();
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);

      // By keyboard: Tab leaves the open popover (closing it) and reaches the duration.
      await navTrigger(page).focus();
      await press(page, "Enter");
      await expect(platformPopover(page)).toBeVisible();
      for (let i = 0; i < 5; i++) await press(page, "Tab");
      await expect(duration(page)).toBeFocused();
      await expect(platformPopover(page)).toHaveCount(0);
      await press(page, "Enter");
      await expect(list).toBeVisible();
      await expect(page.locator("[role=dialog]")).toHaveCount(0);
      // Escape closes only the list; a second one changes nothing.
      await press(page, "Escape");
      await expect(list).toHaveCount(0);
      await expect(duration(page)).toBeFocused();
      await press(page, "Escape");
      await expect(duration(page)).toBeFocused();
      await expect(duration(page)).toHaveText("60 Minuten");
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);
    });

    test("client navigation between the booking routes gives each a fresh booker and leaves no overlay behind", async ({
      page,
    }) => {
      const { stub } = await openBooker(page, "/termin");
      await page.evaluate(() =>
        Object.assign(window, { navigationMarker: true }),
      );
      await duration(page).focus();
      await chooseDuration(page, "90 Minuten");

      await page
        .getByRole("banner")
        .getByRole("link", { name: "Kontakt" })
        .focus();
      await press(page, "Enter");
      await expect(page).toHaveURL(/\/kontakt$/);
      await expect(page.getByRole("grid")).toHaveAccessibleName(
        "November 2026",
      );
      await expect(page.getByRole("combobox")).toHaveCount(0);
      await expect(gridStop(page)).toHaveCount(1);
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);

      await page.goBack();
      await expect(page).toHaveURL(/\/termin$/);
      await expect(duration(page)).toHaveText("60 Minuten");
      await expect(gridStop(page)).toHaveAccessibleName(
        "Donnerstag, 5. November 2026, ausgewählt",
      );
      await page.goForward();
      await expect(page).toHaveURL(/\/kontakt$/);
      await expect(gridStop(page)).toHaveCount(1);
      expect(await page.evaluate(() => "navigationMarker" in window)).toBe(
        true,
      );
      expect(await settledRequests(page, stub.requests)).toEqual([
        "2026-11@60",
        "2026-11@90",
        "2026-11@15",
        "2026-11@60",
        "2026-11@15",
      ]);
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);
    });
  });

  test.describe("at 390px", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
      await recordMenuState(page);
    });

    test("the whole mobile menu by keyboard: the nested platform link opens /termin on the client", async ({
      page,
    }) => {
      await freezeTime(page, NOVEMBER);
      await stubMonths(page, FREE_DAYS);
      await page.goto("/");
      await page.evaluate(() =>
        Object.assign(window, { navigationMarker: true }),
      );
      const menu = page.getByRole("dialog", { name: "Menü" });
      const opener = page.getByRole("button", { name: "Menü" });
      for (const name of ["Zum Inhalt springen", "Startseite", "Menü"]) {
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(name);
      }
      await press(page, "Enter");
      await expect(menu).toBeVisible();
      for (const name of primaryLabels) {
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(name);
      }
      await press(page, "Tab");
      const disclosure = menu.getByRole("button", { name: "Online lernen" });
      await expect(disclosure).toBeFocused();
      await expect(disclosure).toHaveAttribute("aria-expanded", "false");
      await press(page, "Enter");
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      for (const label of platformLabels) {
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(
          new RegExp(`^${label}`),
        );
      }
      await press(page, "Enter");
      await expect(page).toHaveURL(/\/termin$/);
      await expect(menu).toHaveCount(0);
      expect(await page.evaluate(() => "navigationMarker" in window)).toBe(
        true,
      );
      expect(await menuStateEvents(page)).toEqual([true, false]);
      expect(await background(page)).toMatchObject(released);
      // As after every menu link: the next Tab starts at the skip link.
      for (const name of ["Zum Inhalt springen", "Startseite", "Menü"]) {
        await press(page, "Tab");
        await expect(focused(page)).toHaveAccessibleName(name);
      }
      await expect(opener).toHaveAttribute("aria-expanded", "false");
      await press(page, "Tab");
      await expect(duration(page)).toBeFocused();
      await press(page, "Space");
      await expect(
        page.getByRole("listbox", { name: "Dauer", exact: true }),
      ).toBeVisible();
      await press(page, "Escape");
      await expect(duration(page)).toBeFocused();
      await expect.poll(() => overlayLeftovers(page)).toEqual(noOverlay);
    });
  });
});
