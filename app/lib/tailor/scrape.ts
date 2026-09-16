import { logger } from "../log";

const BOILERPLATE =
  /^(jobs|login|sign in|sign up|menu|home|search|about|contact|privacy|terms|cookie|cookies|back to|apply now|save|share|report)/i;
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
  let browser: import("playwright").Browser | undefined;
  const t0 = Date.now();
  try {
    const { chromium } = await import("playwright");
    logger.info("tailor.scrape", "launch", { url });
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1500);
    const text: string = await page.evaluate(
      () => document.body?.innerText ?? "",
    );
    const cleaned = extractMainText(text);
    logger.info("tailor.scrape", "done", {
      url,
      chars: cleaned.length,
      ms: Date.now() - t0,
    });
    return cleaned;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(
      "tailor.scrape",
      "failed",
      { url, ms: Date.now() - t0 },
      err as Error,
    );
    throw new Error(`Failed to read job ad at ${url}: ${msg}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
