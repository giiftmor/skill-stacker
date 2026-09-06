const BOILERPLATE = /^(jobs|login|sign in|sign up|menu|home|search|about|contact|privacy|terms|cookie|cookies|back to|apply now|save|share|report)/i;
const MAX_CHARS = 8000;

export function extractMainText(fullText: string): string {
  const lines = fullText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 4 && !BOILERPLATE.test(l));
  let out = lines.join("\n");
  if (out.length > MAX_CHARS) out = out.slice(0, MAX_CHARS);
  return out;
}

export async function scrapeJobAd(url: string): Promise<string> {
  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1500);
    const text: string = await page.evaluate(() => document.body?.innerText ?? "");
    return extractMainText(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read job ad at ${url}: ${msg}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
