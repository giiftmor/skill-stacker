import { expect, test } from "@playwright/test";

test("guided capture completes to a drafting editor with a partial CV", async ({ page }) => {
  await page.goto("/cvs/new");
  await page.getByPlaceholder("Enter your full name").fill("Guided Client");
  await page.getByPlaceholder("e.g., Senior Software Engineer").fill("Consultant");
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.getByPlaceholder("Company").first().fill("Acme Consulting");
  await page.getByPlaceholder("Role").fill("Senior consultant");
  await page.getByRole("button", { name: /Continue/i }).click();

  // Education & Skills: add two skills
  await page.getByPlaceholder("Enter a skill").fill("Strategy");
  await page.getByRole("button", { name: /Add skill/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();

  // Style step
  await page.getByRole("button", { name: /Open in Editor/i }).click();

  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Guided Client").first()).toBeVisible();
});