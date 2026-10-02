import { expect, test, type APIRequestContext } from "@playwright/test";
import { openActions } from "./actions";

async function createCV(request: APIRequestContext, fullName: string, complete = false) {
  const res = await request.post("/api/resume", {
    data: {
      personal: { fullName, title: "Engineer", phone: "", email: "a@b.c", location: "", linkedin: "" },
      profile: "Projects things.",
      competency: ["Typescript", "SQL", "AWS"],
      experiences: [
        { company: "Acme", role: "Dev", period: "2020-2023", details: "Built the things." },
        { company: "Globex", role: "Senior Dev", period: "", details: "Led a team." },
      ],
      education: complete ? [{ institution: "MIT", qualification: "BSc", period: "2010-2014" }] : [],
      certificate: complete ? [{ name: "AWS", date: "2024" }] : [],
      skill: ["ledgering"],
      reference: complete ? [{ name: "Ref", company: "Acme", role: "Mgr" }] : [],
      additionalInfo: complete ? ["Note"] : [],
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return { slug: body.slug as string, cvId: body.cvId as number };
}

test.describe("roster", () => {
  test("shows a ready dot for a complete Resume and opens the editor", async ({ page, request }) => {
    const { slug } = await createCV(request, "Roster Ready", true);
    await page.goto("/resumes");
    await expect(page.getByTestId(`row-${slug}`).getByText("Roster Ready")).toBeVisible();
    await expect(page.getByTestId(`ready-dot-${slug}`)).toHaveClass(/status-good/);
    await page.locator(`[data-testid="row-${slug}"] a[href="/resumes/${slug}/edit"]`).click();
    await openActions(page);
    await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  });

  test("marking ready persists after reload", async ({ page, request }) => {
    const { slug } = await createCV(request, "Roster Empty");
    await page.goto("/resumes");
    await page.locator(`[data-testid="row-${slug}"]`).getByRole("button", { name: /More/ }).click();
    await page.getByRole("menuitem", { name: "Mark ready" }).click();
    await expect(page.getByTestId(`ready-dot-${slug}`)).toHaveClass(/status-good/);
    await page.reload();
    await expect(page.getByTestId(`ready-dot-${slug}`)).toHaveClass(/status-good/);
  });

  test("delete uses an inline confirm and removes the row", async ({ page, request }) => {
    const { slug } = await createCV(request, "Roster Delete Me");
    await page.goto("/resumes");
    await page.locator(`[data-testid="row-${slug}"]`).getByRole("button", { name: /More/ }).click();
    await page.getByRole("menuitem", { name: /Delete/ }).click();
    await expect(page.getByTestId("confirm-delete")).toBeVisible();
    await page.locator(`[data-testid="confirm-delete"]`).getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(`[data-testid="row-${slug}"]`)).toHaveCount(0);
  });

  test("quick PDF downloads a named file", async ({ page, request }) => {
    const { slug } = await createCV(request, "Roster Pdf");
    await page.goto("/resumes");
    const downloadPromise = page.waitForEvent("download");
    await page.locator(`[data-testid="row-${slug}"]`).getByRole("button", { name: /PDF/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("Roster_Pdf");
  });
});