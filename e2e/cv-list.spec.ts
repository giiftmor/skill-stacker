import { expect, test } from "@playwright/test";

test("roster loads with a title and a create action", async ({ page }) => {
  await page.goto("/resumes");
  await expect(page.getByTestId("roster-title")).toBeVisible();
  await expect(page.getByRole("link", { name: /New client Resume/ })).toBeVisible();
});