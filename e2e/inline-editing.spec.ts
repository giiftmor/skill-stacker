import { type APIRequestContext, expect, test } from "@playwright/test";

async function createCV(request: APIRequestContext) {
  const res = await request.post("/api/cv", {
    data: {
      personal: {
        fullName: "Inline Edits",
        title: "Analyst",
        phone: "",
        email: "i@e.co",
        location: "",
        linkedin: "",
      },
      profile: "Experienced analyst with a focus on delivery.",
      competency: ["Analysis", "SQL"],
      experiences: [
        {
          company: "Co",
          role: "Analyst",
          period: "",
          details: "Analysed things.",
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
  return (await res.json()).cvId as number;
}

test("inline edit commits to the canvas and autosaves", async ({
  page,
  request,
}) => {
  const cvId = await createCV(request);
  await page.route("**/api/cv/*", async (route) => {
    if (route.request().method() === "PUT") {
      await new Promise((r) => setTimeout(r, 1500));
    }
    await route.continue();
  });
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });

  await page.locator('[aria-label^="Edit section profile"]').first().click();
  await page
    .getByPlaceholder("Write a brief professional summary...")
    .fill("Now with more words added to satisfy the length rule.");
  await page.getByTestId("section-save").click();

  await expect(
    page.locator(".cv-page").getByText(/Now with more words added/),
  ).toBeVisible();
  await expect(page.getByText("Saving...")).toBeVisible({ timeout: 45000 });
});

test("command menu jumps to a section", async ({ page, request }) => {
  const cvId = await createCV(request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  await page.keyboard.press("/");
  await page
    .getByRole("dialog", { name: "Command menu" })
    .getByPlaceholder(/Jump to a section/)
    .fill("Profile");
  await page
    .getByRole("dialog", { name: "Command menu" })
    .getByRole("button", { name: "Professional profile" })
    .click();
  await expect(page.getByTestId("section-editor")).toBeVisible();
});

test("template change persists after reload", async ({ page, request }) => {
  const cvId = await createCV(request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("heading", { name: "Style" }).click();
  await page
    .getByRole("button", { name: "Executive", exact: false })
    .first()
    .click();
  await page.reload();
  await page.getByRole("heading", { name: "Style" }).click();
  await expect(
    page.getByRole("button", { name: "Executive", exact: false }).first(),
  ).toHaveClass(/border-\[#d4a853\]/);
});

test("awaiting rewrite soft state when no safe change", async ({
  page,
  request,
}) => {
  const cvId = await createCV(request);
  await page.route("**/api/tailor", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'data: {"type":"status","step":"done"}\n\n',
    }),
  );
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: /analyze/i }).click();
  await expect(page.getByText(/No safe changes/)).toBeVisible();
});
