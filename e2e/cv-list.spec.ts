import { expect, test } from "@playwright/test";

test("roster loads with a title and a create action", async ({ page }) => {
  await page.goto("/cvs");
  await expect(page.getByTestId("roster-title")).toBeVisible();
  await expect(page.getByRole("link", { name: /New client CV/ })).toBeVisible();
});