import { type APIRequestContext, expect, test } from "@playwright/test";
import { openActions } from "./actions";

async function createCV(request: APIRequestContext) {
  const res = await request.post("/api/resume", {
    data: {
      personal: {
        fullName: "Tailor Fixture",
        title: "Engineer",
        phone: "",
        email: "t@e.co",
        location: "",
        linkedin: "",
      },
      profile: "Experienced engineer with a focus on delivery.",
      competency: ["Analysis", "SQL"],
      experiences: [
        {
          company: "Co",
          role: "Engineer",
          period: "",
          details: "Built the things.",
        },
      ],
      education: [],
      certificate: [],
      skill: ["SQL"],
      reference: [],
      additionalInfo: [],
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return { slug: body.slug as string, cvId: body.cvId as number };
}

test("tailor for job via pasted URL shows diffs and apply works", async ({
  page,
  request,
}) => {
  const { slug } = await createCV(request);
  await page.goto(`/resumes/${slug}/edit`);
  await openActions(page);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Tailor" }).click();

  await expect(page.getByText("Tailor for job")).toBeVisible();
  await page
    .getByPlaceholder("Paste a job-ad URL")
    .fill("http://localhost:5252/job-ad-fixture.html");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(page.getByText(/Reading job ad/)).toBeVisible();
  await expect(page.getByText(/Extracting requirements/)).toBeVisible();
  await expect(page.getByText(/Tailoring your resume/)).toBeVisible({
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
  request,
}) => {
  const { slug } = await createCV(request);
  await page.goto(`/resumes/${slug}/edit`);
  await openActions(page);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Tailor" }).click();

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
