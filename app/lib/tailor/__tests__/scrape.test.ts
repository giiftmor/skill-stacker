import { describe, expect, it, vi } from "vitest";
import { extractMainText, scrapeJobAd } from "../scrape";

const mocks = vi.hoisted(() => {
  const pageMock = {
    goto: vi.fn(),
    waitForTimeout: vi.fn(),
    evaluate: vi.fn(),
  };
  const browserMock = {
    newPage: vi.fn().mockResolvedValue(pageMock),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const chromiumMock = {
    launch: vi.fn().mockResolvedValue(browserMock),
  };
  return { pageMock, browserMock, chromiumMock };
});

vi.mock("playwright", () => ({ chromium: mocks.chromiumMock }));

describe("extractMainText", () => {
  it("drops short and boilerplate lines", () => {
    const text =
      "Home\nSearch\n\nSenior React Engineer needed to build dashboards.\nWe are hiring.\n";
    const out = extractMainText(text);
    expect(out).not.toContain("Home");
    expect(out).not.toContain("Search");
    expect(out).toContain("Senior React Engineer");
    expect(out).toContain("We are hiring.");
  });

  it("caps output at 8000 chars", () => {
    const long = "x".repeat(10000);
    expect(extractMainText(long).length).toBeLessThanOrEqual(8000);
  });
});

describe("scrapeJobAd", () => {
  it("logs scrape success with char count", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) =>
      logs.push(String(a[0])),
    );
    mocks.pageMock.evaluate.mockResolvedValue(
      "Home\nSenior React Engineer needed to build dashboards.",
    );
    const text = await scrapeJobAd("https://example.com/job");
    expect(text).toContain("React");
    expect(logs.join("\n")).toContain("[tailor.scrape]");
  });

  it("logs and rethrows scrape failure with the url", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...a: unknown[]) =>
      errors.push(String(a[0])),
    );
    mocks.pageMock.goto.mockRejectedValue(new Error("net down"));
    await expect(scrapeJobAd("https://example.com/bad")).rejects.toThrow(
      /Failed to read job ad/,
    );
    expect(errors.join("\n")).toContain("https://example.com/bad");
  });
});
