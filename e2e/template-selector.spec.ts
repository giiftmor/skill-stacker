import { expect, test } from "@playwright/test";

test("guided capture: style step lists templates and Continue creates", async ({
  page,
}) => {
  await page.goto("/resumes/new");
  await expect(page.getByTestId("capture-title")).toBeVisible();
  await page.getByRole("button", { name: /style/i }).click();
  await expect(
    page.getByText("Choose your template", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Open in Editor/i }).click();
  await page.getByRole("button", { name: "Actions" }).click();
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  expect(page.url()).toMatch(/\/resumes\/[a-z0-9-]+\/edit$/);
});
