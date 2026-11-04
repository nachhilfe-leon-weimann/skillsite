import { expect, test, type Locator, type Page } from "@playwright/test";

import { isolate, settledAnimations, stubAvailability } from "./helpers";

type TransitionRun = { property: string; state: string | null };

/**
 * Record every CSS transition that starts on an element matching `selector`,
 * with the element's `data-state` at that moment. A property that jumps starts
 * no transition, so this tells "animates" from "jumps" without sampling frames
 * (the Tailwind v4 `translate`/`scale` trap).
 */
async function recordTransitions(page: Page, selector: string) {
  await page.evaluate((selector) => {
    const runs: { property: string; state: string | null }[] = [];
    Object.assign(window, { transitionRuns: runs });
    document.addEventListener(
      "transitionrun",
      (event) => {
        const target = event.target as Element;
        if (target.matches(selector))
          runs.push({
            property: event.propertyName,
            state: target.getAttribute("data-state"),
          });
      },
      { capture: true },
    );
  }, selector);
  return () =>
    page.evaluate(
      () =>
        (window as unknown as { transitionRuns: TransitionRun[] })
          .transitionRuns,
    );
}

/** The y component of a computed `translate` value ("0px -1.37px" -> -1.37, "none" -> 0). */
function translateY(value: string) {
  if (value === "none") return 0;
  const [, y = "0px"] = value.split(" ");
  return Number.parseFloat(y);
}

/** The element's computed opacity, translation and scale. */
const restingStyle = (element: Locator) =>
  element.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      opacity: style.opacity,
      translate: style.translate,
      scale: style.scale,
    };
  });

/** The positioned panel of an open select or popover (Radix's wrapper holds exactly one). */
const PANEL = "[data-radix-popper-content-wrapper] > *";

test.beforeEach(async ({ page }) => {
  await isolate(page);
  await stubAvailability(page);
});

/** The duration select's trigger on /termin (hidden from AT while its list is open). */
async function durationSelect(page: Page) {
  await expect(
    page.getByRole("combobox", { name: "Dauer", exact: true }),
  ).toBeVisible();
  return page.locator("[role=combobox]");
}

test("the duration select panel slides and scales in, then out", async ({
  page,
}) => {
  await page.goto("/termin");
  const trigger = await durationSelect(page);
  const runs = await recordTransitions(page, PANEL);
  await trigger.click();
  const list = page.getByRole("listbox", { name: "Dauer" });
  await expect.poll(runs, { message: "entrance transitions" }).toEqual(
    expect.arrayContaining([
      { property: "translate", state: "open" },
      { property: "scale", state: "open" },
    ]),
  );
  await settledAnimations(list);
  const rest = await restingStyle(list);
  expect(rest.opacity, "opacity at rest").toBe("1");
  expect(translateY(rest.translate), "translate at rest").toBe(0);
  expect(Number(rest.scale), "scale at rest").toBe(1);

  await page.keyboard.press("Escape");
  await expect.poll(runs, { message: "exit transitions" }).toEqual(
    expect.arrayContaining([
      { property: "translate", state: "closed" },
      { property: "scale", state: "closed" },
    ]),
  );
  await expect(page.locator("[data-radix-popper-content-wrapper]")).toHaveCount(
    0,
  );
  await expect(trigger).toBeFocused();
});

test("an FAQ answer slides in", async ({ page }) => {
  await page.goto("/preise");
  const trigger = page.locator("main h3 > button[aria-controls]").first();
  const panelId = await trigger.getAttribute("aria-controls");
  const selector = `[id="${panelId}"] > div`;
  const runs = await recordTransitions(page, selector);
  await trigger.click();
  await expect
    .poll(runs, { message: "translate transition" })
    .toEqual(expect.arrayContaining([{ property: "translate", state: null }]));
  const answer = page.locator(selector);
  await settledAnimations(answer);
  const rest = await restingStyle(answer);
  expect(rest.opacity, "opacity at rest").toBe("1");
  expect(translateY(rest.translate), "translate at rest").toBe(0);
});

const platformTrigger = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Online lernen" });
const platformPopover = (page: Page) =>
  page.getByRole("dialog", { name: "Online lernen" });

/**
 * Hold the open navbar panel's exit where it begins: once it turns closed, its
 * transitions and presence animation pause, so the closing panel stays in the
 * page to be probed. The returned function lets the exit run to its end.
 */
async function holdExit(page: Page) {
  await page.locator(PANEL).evaluate((panel) => {
    const observer = new MutationObserver(() => {
      if (panel.getAttribute("data-state") !== "closed") return;
      observer.disconnect();
      for (const animation of panel.getAnimations()) animation.pause();
    });
    observer.observe(panel, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
  });
  return () =>
    page.locator(PANEL).evaluate((panel) => {
      for (const animation of panel.getAnimations()) animation.play();
    });
}

test.describe("the navbar popover", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("slides in and out", async ({ page }) => {
    await page.goto("/");
    const runs = await recordTransitions(page, PANEL);
    await platformTrigger(page).click();
    const panel = platformPopover(page);
    await expect
      .poll(runs, { message: "entrance transition" })
      .toEqual(
        expect.arrayContaining([{ property: "translate", state: "open" }]),
      );
    await settledAnimations(panel);
    const rest = await restingStyle(panel);
    expect(rest.opacity, "opacity at rest").toBe("1");
    expect(translateY(rest.translate), "translate at rest").toBe(0);

    await page.keyboard.press("Escape");
    await expect
      .poll(runs, { message: "exit transition" })
      .toEqual(
        expect.arrayContaining([{ property: "translate", state: "closed" }]),
      );
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
  });

  test("is inert at once while it falls out, and a click on it reaches the page", async ({
    page,
  }) => {
    await page.goto("/");
    await platformTrigger(page).click();
    await expect(platformPopover(page)).toHaveCSS("opacity", "1");
    const panel = page.locator("[role='dialog']");
    const box = (await panel.boundingBox())!;
    await page.evaluate(() =>
      document.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          Object.assign(window, {
            clickedPanel: !!(event.target as Element).closest(
              "[data-radix-popper-content-wrapper]",
            ),
          });
        },
        { capture: true, once: true },
      ),
    );
    const release = await holdExit(page);
    // The pointer still rests on the trigger: this close lets clicks through.
    await page.keyboard.press("Escape");
    await expect(panel).toHaveAttribute("data-state", "closed");
    await expect(panel.locator("> div")).toHaveAttribute("inert", "");
    await expect(panel).toHaveAttribute("aria-hidden", "true");
    await expect(panel).toHaveCSS("pointer-events", "none");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    // Still falling out, not revived by the pointer passing over it.
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute("data-state", "closed");
    expect(
      await page.evaluate(
        () => (window as unknown as { clickedPanel?: boolean }).clickedPanel,
      ),
      "the click landed on the panel",
    ).toBe(false);
    await release();
    await expect(panel).toHaveCount(0);
  });

  test("reopening during the exit leaves one live panel", async ({ page }) => {
    await page.goto("/");
    const trigger = platformTrigger(page);
    await trigger.focus();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
    }
    await page.keyboard.press("Enter");
    const panel = page.locator("[role='dialog']");
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute("data-state", "open");
    await expect(panel.locator("> div")).not.toHaveAttribute("inert");
    // Once the entrance has ended, no earlier exit can still move focus.
    await settledAnimations(panel);
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveCSS("opacity", "1");
  });
});

/**
 * The menu's own motion: the nearest animated ancestor of its "Preise" link
 * inside the dialog, awaited to its end - or null when nothing animates.
 */
const mobileMenuMotion = (page: Page) =>
  page
    .getByRole("dialog", { name: "Menü" })
    .getByRole("link", { name: "Preise" })
    .evaluate(async (link) => {
      let node = link.parentElement;
      while (
        node &&
        node.getAttribute("role") !== "dialog" &&
        getComputedStyle(node).animationName === "none"
      )
        node = node.parentElement;
      if (!node || node.getAttribute("role") === "dialog") return null;
      await Promise.allSettled(
        node.getAnimations().map((animation) => animation.finished),
      );
      const style = getComputedStyle(node);
      return {
        running: node
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
        opacity: style.opacity,
        // The end keyframe's `transform: none`, held by the fill, reads as the identity matrix.
        untransformed: new DOMMatrixReadOnly(
          style.transform === "none" ? undefined : style.transform,
        ).isIdentity,
      };
    });

/** After one frame: the dialog and its backdrop nodes still in the document. */
const mobileMenuNodes = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() =>
          resolve(document.querySelectorAll("body > [data-state]").length),
        ),
      ),
  );

test.describe("the mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("fades its links in and closes at once", async ({ page }) => {
    await page.goto("/");
    // Record the animations that start on the dialog's link container.
    await page.evaluate(() => {
      const starts: string[] = [];
      Object.assign(window, { menuStarts: starts });
      document.addEventListener("animationstart", (event) => {
        const target = event.target as Element;
        if (
          target.closest("[role=dialog]") &&
          target.getAttribute("role") !== "dialog" &&
          [...target.querySelectorAll("a")].some(
            (link) => link.textContent?.trim() === "Preise",
          )
        )
          starts.push(event.animationName);
      });
    });
    await page.getByRole("button", { name: "Menü" }).click();
    const menu = page.getByRole("dialog", { name: "Menü" });
    await expect(menu).toBeVisible();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as unknown as { menuStarts: string[] }).menuStarts,
          ),
        { message: "the links' animation started" },
      )
      .toHaveLength(1);
    expect(await mobileMenuMotion(page)).toEqual({
      running: 0,
      opacity: "1",
      untransformed: true,
    });
    await menu.getByRole("button", { name: "Menü" }).click();
    expect(await mobileMenuNodes(page)).toBe(0);
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the select panel is at its end state at once", async ({ page }) => {
    await page.goto("/termin");
    const trigger = await durationSelect(page);
    await trigger.click();
    const panel = page.getByRole("listbox", { name: "Dauer" });
    await expect(panel).toHaveCSS("opacity", "1", { timeout: 500 });
    expect(
      translateY(
        await panel.evaluate((node) => getComputedStyle(node).translate),
      ),
    ).toBe(0);
    await page.keyboard.press("Escape");
    await expect(
      page.locator("[data-radix-popper-content-wrapper]"),
    ).toHaveCount(0, { timeout: 500 });
    await expect(trigger).toBeFocused();
  });

  test("the mobile menu appears and goes at once", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menü" }).click();
    await expect(page.getByRole("dialog", { name: "Menü" })).toBeVisible();
    expect(await mobileMenuMotion(page)).toBeNull();
    await page.keyboard.press("Escape");
    expect(await mobileMenuNodes(page)).toBe(0);
    await expect(page.getByRole("button", { name: "Menü" })).toBeFocused();
  });

  test("the navbar popover appears and goes at once", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await platformTrigger(page).click();
    const panel = platformPopover(page);
    await expect(panel).toHaveCSS("animation-name", "none");
    await expect(panel).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
    await expect(platformTrigger(page)).toBeFocused();
  });
});
