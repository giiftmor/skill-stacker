import { test, expect } from "@playwright/test";

test.describe("CV List", () => {
  test("loads the CV list page", async ({ page }) => {
    await page.goto("/cvs");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
