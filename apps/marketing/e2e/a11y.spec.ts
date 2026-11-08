import { expect, test, type Page } from "@playwright/test";

import {
  afterTwoFrames,
  freezeTime,
  interceptSubmissions,
  isolate,
  settledRequests,
  stubAvailability,
  stubMonths,
} from "./helpers";
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

  test.describe("at 390px", () => {
    test.use({ viewport: { width: 390, height: 800 } });

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
      await expect(page.getByRole("link", { name: "Startseite" })).toHaveCount(
        1,
      );
      await expect(
        banner.getByRole("link", { name: "Startseite" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Menü" })).toHaveCount(1);
      await expect(closeControl(page)).toHaveAttribute("aria-expanded", "true");
      await expect(
        banner.getByRole("link", { name: "Preise" }),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        banner.getByRole("link", { name: "Ablauf" }),
        "current page: Ablauf",
      ).not.toHaveAttribute("aria-current");
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
      // The menu control (in the dialog now) keeps focus where it was.
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
      await dialog(page).getByRole("button", { name: "Online lernen" }).click();
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
      expect(await focusStops(page, "Tab", expanded.length)).toEqual(expanded);
    });
  });

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
        from: "/",
        target: primaryCta.label,
        to: /\/kontakt#kennenlernen$/,
        nextTab: "Direkt anfragen",
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
        await dialog(page)
          .getByRole("link", { name: new RegExp(`^${target}`) })
          .click();
        await expect(page).toHaveURL(to);
        await expect(dialog(page)).toHaveCount(0);
        expect(await page.evaluate(() => "navigationMarker" in window)).toBe(
          true,
        );
        // Settle two frames: no late focus return pulls focus to the old opener.
        await afterTwoFrames(page);
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

    test("the home link on the home page closes it and leaves focus on the visible home link", async ({
      page,
    }) => {
      await page.goto("/");
      await opener(page).click();
      await dialog(page).getByRole("link", { name: "Startseite" }).focus();
      await page.keyboard.press("Enter");
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

  test("Escape closes it and focuses its trigger", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    // The links become focusable once the entrance has begun.
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

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true });

    test("a tap opens it and it stays open", async ({ page }) => {
      await page.goto("/");
      await trigger(page).tap();
      await expect(popover(page)).toBeVisible();
      // A touch is no hover: the tap's click opens it, nothing closes it again.
      await afterTwoFrames(page);
      await expect(popover(page)).toHaveAttribute("data-state", "open");
      await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    });
  });

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
    // A hover open would have rendered by now.
    await afterTwoFrames(page);
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
    await afterTwoFrames(page);
    await expect(popover(page)).toHaveCount(0);
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
    // Under load, Radix may move a late arrow key's focus back to the platform rows and
    // check another platform: set both choices before the draft is compared.
    await radio(page, "Discord").click();
    await expect(radio(page, "Discord")).toBeChecked();
    await expect(radio(page, "Physik")).toBeChecked();

    // The submit button sends one draft (aborted before it leaves the browser).
    await submit.click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(draftValues(bodies[0]!)).toMatchObject({
      location: "discord-video",
      subject: "Physik",
    });
  });

  test("/kontakt: the subject chips drive the open items, and the draft keeps their order", async ({
    page,
  }) => {
    const bodies = await openForm(page, "/kontakt");
    await expect(openItems(page)).toContainText("Fächer");
    await chip(page, "Physik").click();
    await expect(chip(page, "Physik")).toHaveAttribute("aria-pressed", "true");
    await expect(openItems(page)).not.toContainText("Fächer");
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

  test("the keyboard picks a duration that the next availability request carries", async ({
    page,
  }) => {
    await stubAvailability(page);
    const durations = recordDurations(page);
    await page.goto("/termin");
    await expect(page.getByRole("button", { name: "10:00" })).toBeVisible();
    expect(durations).toEqual(["60"]);
    const select = page.getByRole("combobox", { name: "Dauer", exact: true });
    await expect(select, "the initial value").toHaveText("60 Minuten");
    await expect(select, "collapsed at rest").toHaveAttribute(
      "aria-expanded",
      "false",
    );
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
});

test("the Discord buttons are named by their text only", async ({ page }) => {
  await page.goto("/online-lernen");
  await expect(
    page.getByRole("link", { name: "Server beitreten", exact: true }),
  ).toHaveCount(2);
});

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
  /** The form's title with the chosen slot below it. */
  const formTitle = (page: Page) =>
    page.getByText("Deine Daten", { exact: true }).locator("..");
  /** The booker's status region, which announces a booking's outcome. */
  const resultStatus = (page: Page) => page.getByRole("status");
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
        // Both choices are required and offered in this order.
        const platform = page.getByRole("radiogroup", { name: "Plattform" });
        const subject = page.getByRole("radiogroup", {
          name: "In welchem Fach kann ich dir helfen?",
        });
        await expect(platform, "platform required").toHaveAttribute(
          "aria-required",
          "true",
        );
        await expect(subject, "subject required").toHaveAttribute(
          "aria-required",
          "true",
        );
        await expect(
          platform.getByRole("radio"),
          "platform options in order",
        ).toHaveText(["Microsoft Teams", "Discord"]);
        await expect(
          subject.getByRole("radio"),
          "subject options in order",
        ).toHaveText(["Mathematik", "Informatik", "Physik"]);

        // The form, in order; the open items follow every field.
        const submit = page.getByRole("button", {
          name: "Zahlungspflichtig buchen",
        });
        await expect(formTitle(page)).toBeFocused();
        await press(page, "Shift+Tab");
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
        await expect(gridStop(page)).toBeFocused();
        await press(page, "Shift+Tab");
        await expect(nextMonth(page)).toBeFocused();

        expect(await settledRequests(page, stub.requests)).toEqual([
          "2026-11@60",
          "2026-11@90",
        ]);
        expect(submissions.bodies).toEqual([]);
      });
    });
  }

  test.describe("at 1280px", () => {
    test.use({ viewport: { width: 1280, height: 844 } });

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
      await expect(formTitle(page)).toBeFocused();
      await press(page, "Shift+Tab");
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
      await expect(chip("Mathematik")).toHaveAttribute("aria-pressed", "true");
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
      const failed = page.getByRole("heading", {
        name: "Das hat nicht ganz geklappt",
      });
      await expect(failed).toBeVisible();
      await expect(
        failed.locator("..").getByText("Die Buchung hat nicht geklappt."),
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

    for (const path of ["/termin", "/kontakt"]) {
      test(`${path}: a picked slot moves focus to the form's title, and Back to the selected day`, async ({
        page,
      }) => {
        const { submissions } = await openBooker(page, path);
        await slot(page).focus();
        await press(page, "Enter");
        const title = formTitle(page);
        await expect(title).toBeFocused();
        await expect(title).toHaveText(
          /^Deine Daten\s*Do\., 5\. November – 10:00 Uhr$/,
        );
        // The title is no tab stop: Tab goes on into the form, Shift+Tab to Back.
        await press(page, "Tab");
        await expect(textbox(page, "Vorname")).toBeFocused();
        await press(page, "Shift+Tab");
        await expect(back(page)).toBeFocused();

        await press(page, "Enter");
        await expect(gridStop(page)).toBeFocused();
        await expect(gridStop(page)).toHaveAccessibleName(
          "Donnerstag, 5. November 2026, ausgewählt",
        );
        await press(page, "Tab");
        await expect(slot(page)).toBeFocused();
        expect(submissions.bodies).toEqual([]);
      });
    }

    test("/termin: sending moves focus to the result's title and announces the outcome; Resend and a new choice keep focus in the booker", async ({
      page,
    }) => {
      const { submissions } = await openBooker(page, "/termin");
      await slot(page).focus();
      await press(page, "Enter");
      await textbox(page, "Vorname").fill("Erika");
      await textbox(page, "Nachname").fill("Beispiel");
      await textbox(page, "E-Mail").fill("erika@example.com");
      await radio(page, "Physik").click();
      await page.getByRole("checkbox", { name: /Widerrufsfrist/ }).check();
      await page
        .getByRole("button", { name: "Zahlungspflichtig buchen" })
        .focus();
      await press(page, "Enter");

      // Pending: the title of the state that replaced the form has focus; the
      // status region stays empty, so nothing is announced twice.
      const pending = page.getByRole("heading", {
        level: 3,
        name: "Termin wird gebucht …",
      });
      await expect(pending).toBeFocused();
      const status = resultStatus(page);
      await expect(status).toHaveText("");
      await expect.poll(() => submissions.held()).toBe(1);

      // The outcome: the title keeps focus, the status region announces it.
      const failed = page.getByRole("heading", {
        level: 3,
        name: "Das hat nicht ganz geklappt",
      });
      const failure =
        /^Das hat nicht ganz geklappt\s*Die Buchung hat nicht geklappt\./;
      await submissions.abort();
      await expect(failed).toBeFocused();
      await expect(status).toHaveText(failure);

      // Resend: focus goes back to the title; the region empties until the next outcome.
      await page.getByRole("button", { name: "Erneut senden" }).focus();
      await press(page, "Enter");
      await expect(pending).toBeFocused();
      await expect(status).toHaveText("");
      await expect.poll(() => submissions.held()).toBe(1);
      await submissions.abort();
      await expect(failed).toBeFocused();
      await expect(status).toHaveText(failure);

      // A new choice: once the times are loaded again, the selected day has focus.
      await page.getByRole("button", { name: "Anderen Termin wählen" }).focus();
      await press(page, "Enter");
      await expect(gridStop(page)).toBeFocused();
      await expect(gridStop(page)).toHaveAccessibleName(
        "Donnerstag, 5. November 2026, ausgewählt",
      );
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
      // A hover open would have rendered by now.
      await afterTwoFrames(page);
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
