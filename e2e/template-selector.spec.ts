import { test, expect } from "@playwright/test";

test.describe("Template Selector", () => {
  test("loads the new CV page with template selector", async ({ page }) => {
    await page.goto("/cvs/new");
    await expect(
      page.getByRole("heading", { name: "Choose Your Template" }),
    ).toBeVisible();
  });

  test("has template options displayed", async ({ page }) => {
    await page.goto("/cvs/new");
    const continueBtn = page.getByRole("button", { name: /Continue to Editor/ });
    await expect(continueBtn).toBeVisible();
  });

  test("live preview updates when a template is selected", async ({ page }) => {
    await page.goto("/cvs/new");
    const preview = page.getByRole("heading", { name: "Live Preview" });
    await expect(preview).toBeVisible();
    await page
      .getByRole("button", { name: /Executive.*Premium formal/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Live Preview" }),
    ).toBeVisible();
  });
});
