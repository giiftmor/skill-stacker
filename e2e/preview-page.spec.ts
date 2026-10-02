import { test, expect } from "@playwright/test";
import { openActions } from "./actions";

test.describe("Preview Page", () => {
  test("preview page loads for non-existent Resume", async ({ page }) => {
    await page.goto("/resumes/does-not-exist/preview");
    await expect(page.getByRole("button", { name: /Print/ })).toBeVisible({ timeout: 10000 });
  });

  test("edit page loads for non-existent Resume", async ({ page }) => {
    await page.goto("/resumes/does-not-exist/edit");
    await openActions(page);
    await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 10000 });
  });
});
