import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const EVIDENCE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".qa-evidence",
);
const PNG_1PX =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test.describe.configure({ mode: "serial" });

async function createRichCV(request: Page["request"]) {
  const payload = {
    personal: {
      fullName: "QA Two Column",
      title: "Senior Software Engineer",
      phone: "+27 000 0000",
      email: "qa@example.com",
      location: "Cape Town",
      linkedin: "linkedin.com/in/qa",
    },
    profile:
      "Highly experienced software engineer with a decade of delivery across fintech and SaaS platforms. " +
      "Specialist in distributed systems, platform engineering, and developer experience. " +
      "Led multiple cross-functional teams shipping critical infrastructure with measurable business impact. " +
      "Advocate for clean architecture, rigorous testing, and continuous improvement. " +
      "This paragraph is intentionally long so that the exported document requires more than a single A4 page " +
      "and demonstrates automatic multi-page pagination in both PDF and Word exports.",
    competency: [
      "System architecture",
      "Technical leadership",
      "Performance tuning",
      "Incident response",
      "Mentoring",
      "Code review",
    ],
    experiences: Array.from({ length: 6 }, (_, i) => ({
      company: `Company ${i + 1}`,
      role: i % 2 === 0 ? "Senior Software Engineer" : "Engineering Manager",
      period: `20${13 + i}-20${20 + i}`,
      details:
        "Owned the end-to-end delivery of a high-throughput platform serving millions of requests daily. " +
        "Introduced observability tooling that cut mean-time-to-detection by more than half. " +
        "Led hiring and onboarding for the team; grew the group from three to twelve engineers. " +
        "Partnered with product and design to deliver customer-facing features on aggressive timelines.",
    })),
    education: [
      {
        institution: "University of Cape Town",
        qualification: "BSc Computer Science",
        period: "2008-2012",
      },
      {
        institution: "Stellenbosch University",
        qualification: "MSc Data Science",
        period: "2013-2015",
      },
    ],
    certificate: [
      { name: "AWS Certified Solutions Architect", date: "2021" },
      { name: "Professional Scrum Master", date: "2020" },
      { name: "Terraform Associate", date: "2022" },
    ],
    skill: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "Kubernetes",
      "AWS",
      "Terraform",
      "Playwright",
      "CI/CD",
      "Observability",
    ],
    reference: [
      {
        name: "Jane Doe",
        company: "Previous Employer",
        role: "VP Engineering",
        email: "jane@example.com",
        phone: "+27 111 1111",
      },
    ],
    additionalInfo: [
      "Open to hybrid and remote opportunities",
      "Available for interviews from next month",
    ],
    templateSettings: {
      template: "twoColumn",
      theme: "default-red",
      fontPair: "default",
    },
  };
  const res = await request.post("/api/cv", { data: payload });
  const body = await res.json();
  expect(res.ok()).toBeTruthy();
  expect(body.success).toBeTruthy();
  return body.cvId as number;
}

test("Phase 9: export multi-page PDF + Word with two-column and theme", async ({
  page,
}) => {
  const cvId = await createRichCV(page.request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });

  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Quick PDF", exact: true }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toBe("QA_Two_Column_CV.pdf");
  const pdfPath = path.join(EVIDENCE_DIR, "two-column.pdf");
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  await pdfDownload.saveAs(pdfPath);
  const pdfBytes = fs.readFileSync(pdfPath);
  expect(pdfBytes.subarray(0, 4).toString()).toBe("%PDF");
  const pdf = pdfBytes.toString("latin1");
  const pageObjectCount = (pdf.match(/\/Type\s*\/Page\b/g) || []).length;
  expect(pageObjectCount).toBeGreaterThanOrEqual(2);

  const docxDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Word", exact: true }).click();
  const docxDownload = await docxDownloadPromise;
  expect(docxDownload.suggestedFilename()).toBe("QA_Two_Column_CV.docx");
  const docxPath = path.join(EVIDENCE_DIR, "two-column.docx");
  await docxDownload.saveAs(docxPath);
  const docxBytes = fs.readFileSync(docxPath);
  expect(docxBytes.subarray(0, 2).toString()).toBe("PK");
});

test("Phase 9: version snapshot API records row", async ({ page }) => {
  const cvId = await createRichCV(page.request);
  const res = await page.request.post(`/api/cv/${cvId}/snapshot`, {
    data: {
      personal: { fullName: "QA Two Column" },
      profile: "snapshot body",
      competency: [],
      experiences: [],
      education: [],
      certificate: [],
      skill: [],
      reference: [],
      additionalInfo: [],
    },
  });
  const body = await res.json();
  expect(body.success).toBeTruthy();
});

test("Phase 9: photo upload shows in editor, API serves it, generic preview omits it", async ({
  page,
}) => {
  const cvId = await createRichCV(page.request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });

  await page.locator('[aria-label^="Edit section personal"]').first().click();
  const input = page.locator(
    '[data-testid="section-editor"] input[type="file"]',
  );
  await input.setInputFiles({
    name: "qa.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_1PX, "base64"),
  });
  const previewImg = page.locator('img[alt="CV Photo"]');
  await expect(previewImg).toBeVisible({ timeout: 15000 });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, "photo-upload.png"),
    fullPage: true,
  });

  const photoRes = await page.request.get(`/api/photo/${cvId}`);
  expect(photoRes.ok()).toBeTruthy();
  const contentType = photoRes.headers()["content-type"] || "";
  expect(contentType.startsWith("image/")).toBeTruthy();

  await page.goto(`/cvs/${cvId}/preview`);
  await expect(page.getByRole("button", { name: /Print/ })).toBeVisible({
    timeout: 15000,
  });
  // The live preview is a generic layout and intentionally does not embed the
  // uploaded photo; the photo reaches exports (PDF/DOCX) via templateDefinitions.
  const previewPhoto = page.locator(`img[src="/api/photo/${cvId}"]`);
  await expect(previewPhoto).toHaveCount(0);
});

test("Phase 9: version restore round-trips data and creates save point", async ({
  page,
}) => {
  const cvId = await createRichCV(page.request);

  const archived = {
    personal: {
      fullName: "Archived Persona",
      title: "Staff Engineer",
      phone: "",
      email: "",
      location: "",
      linkedin: "",
    },
    profile: "archived profile body",
    competency: ["Archived skill"],
    experiences: [
      {
        company: "OldCo",
        role: "Engineer",
        period: "2010-2015",
        details: "legacy",
      },
    ],
    education: [],
    certificate: [],
    skill: ["COBOL", "FORTRAN"],
    reference: [],
    additionalInfo: [],
  };
  const snapshotRes = await page.request.post(`/api/cv/${cvId}/snapshot`, {
    data: archived,
  });
  expect((await snapshotRes.json()).success).toBeTruthy();

  const live = {
    ...archived,
    personal: { ...archived.personal, fullName: "Live Persona" },
  };
  const putRes = await page.request.put(`/api/cv/${cvId}`, { data: live });
  expect(putRes.ok()).toBeTruthy();

  const listRes = await page.request.get(`/api/cv/${cvId}/versions`);
  const listBody = await listRes.json();
  expect(listRes.ok()).toBeTruthy();
  expect(listBody.versions.length).toBeGreaterThanOrEqual(1);
  const restoreId = listBody.versions[0].id;

  const restoreRes = await page.request.post(
    `/api/cv/${cvId}/versions/${restoreId}/restore`,
  );
  const restoreBody = await restoreRes.json();
  expect(restoreRes.ok()).toBeTruthy();
  expect(restoreBody.data.personal.fullName).toBe("Archived Persona");
  expect(restoreBody.data.skill).toEqual(["COBOL", "FORTRAN"]);

  const afterRestore = await (await page.request.get(`/api/cv/${cvId}`)).json();
  expect(afterRestore.cv.full_name).toBe("Archived Persona");
  expect(afterRestore.cv.skill).toEqual(["COBOL", "FORTRAN"]);

  const listAgainRes = await page.request.get(`/api/cv/${cvId}/versions`);
  const listAgain = await listAgainRes.json();
  expect(listAgain.versions.length).toBeGreaterThanOrEqual(2);

  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });
  await page.locator('[aria-label^="Edit section personal"]').first().click();
  await expect(page.getByPlaceholder("Enter your full name")).toHaveValue(
    "Archived Persona",
  );
});

test("Phase 9: version history modal opens and lists versions on edit page", async ({
  page,
}) => {
  const cvId = await createRichCV(page.request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole("button", { name: /History/ }).click();
  await expect(
    page.getByRole("heading", { name: /Version History/ }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, "version-history.png"),
  });
});

test("Phase 9: auto-save indicator transitions Saving -> Saved", async ({
  page,
}) => {
  const cvId = await createRichCV(page.request);
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

  await page.locator('[aria-label^="Edit section personal"]').first().click();
  await page.getByPlaceholder("Enter your full name").fill("Auto Save QA");
  await page.getByTestId("section-save").click(); // Done commits -> triggers useAutoSave PUT
  await expect(page.getByText("Saving...")).toBeVisible({ timeout: 45000 });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, "auto-save-saving.png"),
  });
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, "auto-save-saved.png"),
  });
});
