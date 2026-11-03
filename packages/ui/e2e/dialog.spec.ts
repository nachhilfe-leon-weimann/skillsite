import { expect, test } from "./fixtures";

for (const theme of ["light", "dark"]) {
  test(`Dialog contains focus, resolves labels and returns focus in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=overlays-dialog--default&viewMode=story&globals=theme:${theme}`,
    );
    const opener = page.getByRole("button", {
      name: "Dialog öffnen",
      exact: true,
    });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Deine Angaben",
      exact: true,
    });
    await expect(dialog).toHaveAccessibleDescription(
      "Prüfe deine Angaben vor dem Schließen.",
    );
    await expect(dialog).toHaveCSS("max-width", "512px");
    await expect(dialog).toHaveCSS("border-radius", "28px");
    await expect(dialog).toHaveCSS("padding", "28px");
    const first = dialog.getByRole("textbox", { name: "Vorname" });
    await expect(first).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Hintergrundaktion" }),
    ).toHaveCount(0);
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: "Schließen", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    const stable = dialog.getByRole("button", { name: "Fokus halten (0)" });
    await stable.click();
    await expect(
      dialog.getByRole("button", { name: "Fokus halten (1)" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.getByRole("status")).toHaveText("Schließereignisse: 1");
  });
}

for (const action of ["Schließen", "backdrop"]) {
  test(`${action} dismisses once; panel interaction does not dismiss`, async ({
    page,
  }) => {
    await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
    await page
      .getByRole("button", { name: "Dialog öffnen", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Deine Angaben",
      exact: true,
    });
    await dialog.getByRole("textbox").click();
    await expect(dialog).toBeVisible();
    await expect(page.locator("body")).toHaveAttribute("data-scroll-locked");
    if (action === "backdrop") await page.mouse.click(2, 2);
    else
      await dialog.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("Schließereignisse: 1");
    await expect(
      page.getByRole("button", { name: "Dialog öffnen", exact: true }),
    ).toBeFocused();
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
    await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
  });
}

for (const action of ["Extern schließen", "Dialog entfernen"]) {
  test(`${action} releases modality and returns focus without calling onClose`, async ({
    page,
  }) => {
    await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
    const opener = page.getByRole("button", {
      name: "Dialog öffnen",
      exact: true,
    });
    await opener.click();
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.getByRole("status")).toHaveText("Schließereignisse: 0");
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
    await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
    await expect(
      page.getByRole("button", { name: "Hintergrundaktion" }),
    ).toBeVisible();
  });
}

for (const action of [
  "Auslöser entfernen",
  "Auslöser ausblenden",
  "Auslöser deaktivieren",
]) {
  test(`${action} restores to the visible documented fallback`, async ({
    page,
  }) => {
    await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
    await page
      .getByRole("button", { name: "Dialog öffnen", exact: true })
      .click();
    await page.getByRole("button", { name: action }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    const fallback = page.getByRole("heading", { name: "Dialogbeispiele" });
    await expect(fallback).toBeVisible();
    await expect(fallback).toBeFocused();
  });
}

test("nested Dialog consumes Escape only at the top and restores parent focus/lock", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
  await page
    .getByRole("button", { name: "Dialog öffnen", exact: true })
    .click();
  await page.getByRole("button", { name: "Zweiten Dialog öffnen" }).click();
  const nested = page.getByRole("dialog", {
    name: "Zweiter Dialog",
    exact: true,
  });
  await expect(nested.getByRole("button", { name: "Zurück" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nested).toHaveCount(0);
  const parent = page.getByRole("dialog", {
    name: "Deine Angaben",
    exact: true,
  });
  await expect(
    parent.getByRole("button", { name: "Zweiten Dialog öffnen" }),
  ).toBeFocused();
  await expect(page.locator("body")).toHaveAttribute("data-scroll-locked");
  await expect(page.locator('[role="status"]')).toHaveText(
    "Schließereignisse: 0",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Schließereignisse: 1");
});

for (const width of [390, 1280]) {
  test(`custom layout fills the ${width}px viewport and contains its controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(
      "/iframe.html?id=overlays-dialog--custom-layout&viewMode=story",
    );
    const opener = page.getByRole("button", {
      name: "Dialog öffnen",
      exact: true,
    });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Vollflächiger Dialog" });
    await expect(dialog).toHaveCSS("animation-name", "none");
    await expect(dialog).toHaveCSS("transform", "none");
    await expect(dialog).toHaveAccessibleDescription(
      "Prüfe deine Angaben vor dem Schließen.",
    );
    await expect
      .poll(() => dialog.boundingBox())
      .toEqual({ x: 0, y: 0, width, height: 844 });
    await expect(dialog.getByRole("textbox")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: "Schließen", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });
}

test("normal exit remains present but immediately inert, then restores focus and removes locks", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
  const opener = page.getByRole("button", {
    name: "Dialog öffnen",
    exact: true,
  });
  await opener.click();
  const panel = page.locator('[role="dialog"]');
  await expect(panel).toHaveCSS("animation-name", "rise");
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(panel).toHaveAttribute("data-state", "closed");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(panel).toHaveCSS("animation-name", "fall");
  await expect(panel).toHaveCSS("pointer-events", "none");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      panel
        .evaluate((element) => element.contains(document.activeElement))
        .catch(() => false),
    )
    .toBe(false);
  await expect(panel).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
});

test("rapid controlled reopen preserves focus and does not leave a delayed close or duplicate lock", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
  const opener = page.getByRole("button", {
    name: "Dialog öffnen",
    exact: true,
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    await opener.click();
    await page.getByRole("button", { name: "Schließen", exact: true }).click();
    await expect(page.locator('[role="dialog"]')).toHaveAttribute(
      "data-state",
      "closed",
    );
    // Simulate a parent reopening controlled state while the exit is still present.
    await opener.evaluate((element) => {
      if (element instanceof HTMLElement) element.click();
    });
    const input = page.getByRole("textbox", { name: "Vorname" });
    await input.focus();
    await page.waitForTimeout(350);
    await expect(input).toBeFocused();
    await expect(
      page.locator('[role="dialog"][data-state="open"]'),
    ).toHaveCount(1);
    await expect(page.locator("body")).toHaveAttribute(
      "data-scroll-locked",
      "1",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
  }
});

test("reduced motion has no delayed closed content or focus steal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
  const opener = page.getByRole("button", {
    name: "Dialog öffnen",
    exact: true,
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    await opener.click();
    await expect(page.getByRole("dialog")).toHaveCSS("animation-name", "none");
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
  }
});

for (const story of ["explicit-focus-return", "navigation-focus"]) {
  test(`${story} respects the consumer's focus destination`, async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=overlays-dialog--${story}&viewMode=story`);
    await page
      .getByRole("button", { name: "Dialog öffnen", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Dialogbeispiele" }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Dialog öffnen", exact: true }),
    ).not.toBeFocused();
  });
}

test("default panel preserves phone gutters and spacing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/iframe.html?id=overlays-dialog--default&viewMode=story");
  await page
    .getByRole("button", { name: "Dialog öffnen", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Deine Angaben",
    exact: true,
  });
  await expect(dialog).toHaveCSS("padding", "24px");
  await expect(dialog).toHaveCSS("border-radius", "28px");
  const box = await dialog.boundingBox();
  expect(box?.x).toBe(16);
  expect(box?.width).toBe(358);
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});
