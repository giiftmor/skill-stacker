import { test, expect } from "@playwright/test";

test.describe("Template Selector", () => {
  test("loads the new CV page with template selector", async ({ page }) => {
    await page.goto("/cvs/new");
    await expect(page.locator("h2")).toContainText("Choose Your Template");
  });

  test("has template options displayed", async ({ page }) => {
    await page.goto("/cvs/new");
    const continueBtn = page.getByRole("button", { name: /Continue to Editor/ });
    await expect(continueBtn).toBeVisible();
  });
});
