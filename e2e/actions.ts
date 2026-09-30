import { expect, type Page } from "@playwright/test";

export async function openActions(page: Page, timeout = 15_000): Promise<void> {
  await page.getByRole("button", { name: "Actions" }).click({ timeout });
  await expect(
    page.getByRole("button", { name: "Quick PDF", exact: true }),
  ).toBeVisible({ timeout });
}
