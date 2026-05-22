import { test, expect } from "@playwright/test";

test.describe("Preview Page", () => {
  test("preview page loads for non-existent CV", async ({ page }) => {
    await page.goto("/cvs/999999/preview");
    await expect(page.getByRole("button", { name: /Print/ })).toBeVisible({ timeout: 10000 });
  });

  test("edit page loads for non-existent CV", async ({ page }) => {
    await page.goto("/cvs/999999/edit");
    await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 10000 });
  });
});
