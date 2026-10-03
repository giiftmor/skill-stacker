const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const logs = [];
  page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`PAGEERROR: ${e}`));

  const base = "http://localhost:5252";
  const listRes = await fetch(`${base}/api/resume`);
  const list = await listRes.json();
  const slug = list.cvs?.[0]?.slug;
  if (!slug) throw new Error("No resumes on the server to open");
  await page.goto(`${base}/resumes/${slug}/edit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/opencode/tailor_idle.png", fullPage: true });

  const body = await page.innerText("body");
  console.log("hasPanel:", body.includes("Tailor for job"));
  console.log("hasUrlInput:", (await page.getByPlaceholder("Paste a job-ad URL").count()) > 0);
  console.log("hasAnalyze:", (await page.getByRole("button", { name: "Analyze" }).count()) > 0);
  const headings = await page.getByRole("heading").allInnerTexts();
  console.log("headings:", headings.slice(0, 4));
  console.log("---console---");
  for (const l of logs.slice(0, 15)) console.log(l);
  await browser.close();
})();