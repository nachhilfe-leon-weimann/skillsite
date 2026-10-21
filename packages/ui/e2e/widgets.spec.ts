import { expect, test } from "./fixtures";

for (const theme of ["light", "dark"]) {
  test(`Button supports keyboard activation in ${theme} mode`, async ({
    page,
  }) => {
    const response = await page.goto(
      `/iframe.html?id=primitives-button--primary&viewMode=story&globals=theme:${theme}`,
    );
    expect(response?.status()).toBe(200);
    const button = page.getByRole("button", {
      name: "Termin buchen",
      exact: true,
    });
    await expect(button).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    // Probe native activation without adding a fixture-only story or app route.
    await button.evaluate((element) => {
      element.dataset.activations = "0";
      element.addEventListener("click", () => {
        element.dataset.activations = String(
          Number(element.dataset.activations) + 1,
        );
      });
    });
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("data-activations", "1");
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("data-activations", "2");
    await page.keyboard.press("Shift+Tab");
    await expect(button).not.toBeFocused();
  });
}
