import { expect, test } from "@playwright/test";

test("tailor for job via pasted URL shows diffs and apply works", async ({
  page,
}) => {
  await page.goto("/cvs/6/edit");
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });

  await expect(page.getByText("Tailor for job")).toBeVisible();
  await page
    .getByPlaceholder("Paste a job-ad URL")
    .fill("http://localhost:5252/job-ad-fixture.html");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(page.getByText(/Reading job ad/)).toBeVisible();
  await expect(page.getByText(/Extracting requirements/)).toBeVisible();
  await expect(page.getByText(/Tailoring your CV/)).toBeVisible({
    timeout: 180_000,
  });
  await expect(page.getByRole("button", { name: "Apply" }).first()).toBeVisible(
    { timeout: 180_000 },
  );
  await page.getByRole("button", { name: "Apply" }).first().click();
  await expect(page.getByText("Applied", { exact: false })).toBeVisible({
    timeout: 180_000,
  });
});

test("tailor for job via pasted text works without a browser scrape", async ({
  page,
}) => {
  await page.goto("/cvs/6/edit");
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });

  await page
    .getByPlaceholder("…or paste the job text directly")
    .fill("We need a React developer who led teams.");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(page.getByText(/Extracting requirements/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply" }).first()).toBeVisible(
    { timeout: 180_000 },
  );
  await page.getByRole("button", { name: "Apply" }).first().click();
  await expect(page.getByText("Applied", { exact: false })).toBeVisible({
    timeout: 180_000,
  });
});
