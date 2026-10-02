import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

const SLIDE = '[data-testid="cv-slide"]';
const PRINT_AREA = "#cv-print-area";

function bullets(start: number, count: number) {
  return Array.from(
    { length: count },
    (_, i) =>
      `Delivered measurable outcome ${start + i} by owning the migration end to end across six teams, three regions and two compliance audits.`,
  ).join("\n");
}

async function seedLongCv(request: APIRequestContext) {
  const res = await request.post("/api/resume", {
    data: {
      personal: {
        fullName: "Pagination Fixture",
        title: "Staff Engineer",
        phone: "000 000 0000",
        email: "pagination@example.com",
        location: "Johannesburg",
        linkedin: "",
      },
      profile:
        "Engineer with a decade of delivery experience across payments and platform teams.",
      competency: ["Typescript", "SQL", "AWS", "Kubernetes"],
      experiences: [
        {
          company: "Acme Corporation",
          role: "Senior Engineer",
          period: "2020-2023",
          details: bullets(1, 28),
        },
        {
          company: "Globex Holdings",
          role: "Principal Engineer",
          period: "2016-2020",
          details: bullets(29, 28),
        },
      ],
      education: [
        {
          institution: "University of Johannesburg",
          qualification: "BSc Computer Science",
          period: "2012-2015",
        },
      ],
      certificate: [{ name: "AWS Solutions Architect", date: "2021" }],
      skill: ["Pagination", "TypeScript", "Postgres", "Playwright"],
      reference: [
        {
          name: "Reference Person",
          company: "Acme Corporation",
          role: "Engineering Manager",
          email: "ref@example.com",
          phone: "111 222 3333",
        },
      ],
      additionalInfo: ["Available for hybrid and remote opportunities."],
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return { slug: body.slug as string, cvId: body.cvId as number };
}

async function openPreview(page: Page, slug: string) {
  await page.goto(`/resumes/${slug}/preview`);
  await expect(
    page.getByRole("button", { name: "Print / Save PDF" }),
  ).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(page.locator(`${SLIDE} .cv-page`)).toHaveCount(1, {
    timeout: 20_000,
  });
  await expect(
    page.locator(`${SLIDE} .cv-measurer .cv-block`).first(),
  ).toBeAttached();
}

async function indicatorText(page: Page) {
  const text = await page.getByTestId("page-indicator").textContent();
  return (text ?? "").replace(/\s+/g, " ").trim();
}

async function slideTotal(page: Page) {
  const match = (await indicatorText(page)).match(/\/\s*(\d+)$/);
  if (!match)
    throw new Error(`Unreadable page indicator: ${await indicatorText(page)}`);
  return Number(match[1]);
}

async function settlePrintTree(page: Page, expectedPages: number) {
  await page.emulateMedia({ media: "print" });
  await expect
    .poll(() => page.locator(`${PRINT_AREA} .cv-page`).count(), {
      timeout: 30_000,
      message: `print tree never settled to ${expectedPages} pages`,
    })
    .toBe(expectedPages);
  return page.locator(`${PRINT_AREA} .cv-page`).count();
}

async function pdfPageCount(page: Page) {
  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
}

test.describe("measured A4 pagination", () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    const { slug: seeded } = await seedLongCv(request);
    slug = seeded;
  });

  test.afterAll(async ({ request }) => {
    if (slug) {
      await request.delete(`/api/resume/${slug}`);
    }
  });

  test("splits a long CV into multiple A4 pages", async ({ page }) => {
    await openPreview(page, slug);

    const total = await slideTotal(page);
    expect(total).toBeGreaterThan(1);

    // The print tree is laid out (and therefore paginated) even in screen
    // media, so it must already show every page before any print settle.
    await expect
      .poll(() => page.locator(`${PRINT_AREA} .cv-page`).count(), {
        timeout: 20_000,
        message: "print tree should already be paginated in screen media",
      })
      .toBe(total);

    const slides = await page.locator(`${SLIDE} .cv-page`).count();
    expect(slides).toBe(1);

    const blockParity = await page.evaluate(
      ([slideSel, printSel]) => {
        const measured = document.querySelectorAll(
          `${slideSel} .cv-measurer > .cv-block`,
        ).length;
        const printed = Array.from(
          document.querySelectorAll(`${printSel} .cv-page`),
        ).reduce(
          (sum, page) => sum + page.querySelectorAll(".cv-block").length,
          0,
        );
        return { measured, printed };
      },
      [SLIDE, PRINT_AREA] as const,
    );
    expect(blockParity.measured).toBeGreaterThan(0);
    expect(blockParity.printed).toBe(blockParity.measured);
  });

  test("no page overflows its own box", async ({ page }) => {
    await openPreview(page, slug);
    await expect
      .poll(() => page.locator(`${PRINT_AREA} .cv-page`).count(), {
        timeout: 20_000,
        message: "print tree should already be paginated in screen media",
      })
      .toBeGreaterThan(1);

    const report = await page.$$eval(`${PRINT_AREA} .cv-page`, (els) =>
      els.map((el) => {
        const page = el as HTMLElement;
        const style = getComputedStyle(page);
        const padBottom = parseFloat(style.paddingBottom) || 0;
        const contentBottom = page.clientHeight - padBottom;
        const blocks = Array.from(page.querySelectorAll(".cv-block"));
        const last = blocks[blocks.length - 1] as HTMLElement | undefined;
        const pageTop = page.getBoundingClientRect().top;
        const lastBottom = last
          ? last.getBoundingClientRect().bottom - pageTop
          : 0;
        const heading = last?.querySelector("h2.heading_1") ?? null;
        let bodyAfterHeading = "";
        if (heading && last) {
          const clone = last.cloneNode(true) as HTMLElement;
          for (const h of clone.querySelectorAll("h2")) h.remove();
          bodyAfterHeading = (clone.textContent ?? "").trim();
        }
        return {
          blocks: blocks.length,
          overflow: page.scrollHeight - page.clientHeight,
          spillPastContentBox: Math.max(0, lastBottom - contentBottom),
          headingAlone: Boolean(heading) && bodyAfterHeading.length === 0,
        };
      }),
    );

    expect(report.length).toBeGreaterThan(1);
    for (const pageReport of report) {
      expect(pageReport.blocks).toBeGreaterThan(0);
      expect(pageReport.overflow).toBeLessThanOrEqual(1);
      expect(pageReport.spillPastContentBox).toBeLessThanOrEqual(1);
      expect(pageReport.headingAlone).toBe(false);
    }

    // The on-screen slide page must not overflow either (screen media).
    const slideOverflow = await page
      .locator(`${SLIDE} .cv-page`)
      .evaluate(
        (el) =>
          (el as HTMLElement).scrollHeight - (el as HTMLElement).clientHeight,
      );
    expect(slideOverflow).toBeLessThanOrEqual(1);
  });

  test("pages stay white in dark mode", async ({ page }) => {
    await openPreview(page, slug);
    await page.emulateMedia({ colorScheme: "dark" });

    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    ).toBe(true);

    const slideBg = await page
      .locator(`${SLIDE} .cv-page`)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const printBg = await page
      .locator(`${PRINT_AREA} .cv-page`)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const measurerBg = await page
      .locator(`${SLIDE} .cv-measurer`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(slideBg).toBe("rgb(255, 255, 255)");
    expect(printBg).toBe("rgb(255, 255, 255)");
    expect(measurerBg).toBe("rgb(255, 255, 255)");
  });

  test("printed PDF page count equals print tree page count", async ({
    page,
  }) => {
    await openPreview(page, slug);

    const total = await slideTotal(page);
    expect(total).toBeGreaterThan(1);

    // Regression: the snapshot must already carry every page with NO print
    // settle and NO waiting — print output is captured from the paginated tree
    // that exists before print media is ever applied.
    const pdfPages = await pdfPageCount(page);
    expect(pdfPages).toBe(total);

    const settled = await settlePrintTree(page, total);
    expect(settled).toBe(total);
    const pdfAfterSettle = await pdfPageCount(page);
    expect(pdfAfterSettle).toBe(total);
  });

  test("measurer and slide hidden in print, print tree visible", async ({
    page,
  }) => {
    await openPreview(page, slug);
    await settlePrintTree(page, await slideTotal(page));

    await expect(page.locator(`${PRINT_AREA} .cv-measurer`)).toBeHidden();
    await expect(page.locator(`${SLIDE} .cv-measurer`)).toBeHidden();
    await expect(page.locator(`${PRINT_AREA} .cv-page`).first()).toBeVisible();
    await expect(page.locator(`${PRINT_AREA} .cv-page`).last()).toBeVisible();
    await expect(page.locator(SLIDE)).toBeHidden();
    await expect(page.locator("main")).toBeHidden();
    await expect(page.getByTestId("page-controls")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Print / Save PDF" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Previous page", exact: true }),
    ).toBeHidden();
  });

  test("slide shows one page at a time and navigates", async ({ page }) => {
    await openPreview(page, slug);

    const total = await slideTotal(page);
    expect(total).toBeGreaterThan(2);
    await expect(page.getByTestId("page-indicator")).toHaveText(`1 / ${total}`);
    await expect(page.locator(`${SLIDE} .cv-page`)).toHaveCount(1);

    const firstPageText = await page.locator(`${SLIDE} .cv-page`).innerText();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("page-indicator")).toHaveText(`2 / ${total}`);
    await expect(page.locator(`${SLIDE} .cv-page`)).toHaveCount(1);
    expect(await page.locator(`${SLIDE} .cv-page`).innerText()).not.toBe(
      firstPageText,
    );

    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(page.getByTestId("page-indicator")).toHaveText(`3 / ${total}`);

    await page.keyboard.press("PageDown");
    await expect(page.getByTestId("page-indicator")).toHaveText(`4 / ${total}`);
    await expect(page.locator(`${SLIDE} .cv-page`)).toHaveCount(1);

    await page
      .getByRole("button", { name: "Previous page", exact: true })
      .click();
    await expect(page.getByTestId("page-indicator")).toHaveText(`3 / ${total}`);

    await page.keyboard.press("PageUp");
    await expect(page.getByTestId("page-indicator")).toHaveText(`2 / ${total}`);

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("page-indicator")).toHaveText(`1 / ${total}`);
    await expect(page.locator(`${SLIDE} .cv-page`)).toHaveCount(1);
    expect(await page.locator(`${SLIDE} .cv-page`).innerText()).toBe(
      firstPageText,
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("page-indicator")).toHaveText(`1 / ${total}`);

    await page.getByRole("button", { name: "Next page", exact: true }).click();
    for (let i = 0; i < total - 1; i += 1) {
      await page.keyboard.press("ArrowRight");
    }
    await expect(page.getByTestId("page-indicator")).toHaveText(
      `${total} / ${total}`,
    );
    await expect(page.locator(`${SLIDE} .cv-page`)).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Next page", exact: true }),
    ).toBeDisabled();
  });
});
