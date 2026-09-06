import { beforeEach, describe, expect, it, vi } from "vitest";
import { runTailorPipeline } from "../pipeline";

const mocks = vi.hoisted(() => ({
  scrapeJobAd: vi.fn(),
  extractMainText: vi.fn((t: string) => t),
  extractRequirements: vi.fn(),
  buildTailorDiffs: vi.fn(),
}));

vi.mock("../scrape", () => ({
  scrapeJobAd: mocks.scrapeJobAd,
  extractMainText: mocks.extractMainText,
}));
vi.mock("../extract", () => ({
  extractRequirements: mocks.extractRequirements,
}));
vi.mock("../tailor", () => ({ buildTailorDiffs: mocks.buildTailorDiffs }));

beforeEach(() => vi.clearAllMocks());

describe("runTailorPipeline", () => {
  it("runs scrape->extract->tailor and emits progress + final diff", async () => {
    const events: string[] = [];
    mocks.scrapeJobAd.mockResolvedValue("job ad body");
    mocks.extractRequirements.mockResolvedValue({
      must_have: ["React"],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockResolvedValue([]);

    const diffs = await runTailorPipeline({
      request: { jobUrl: "https://example.com/job" },
      cv: { profile: "x" },
      onEvent: (e) =>
        events.push(`${e.type}:${e.type === "status" ? e.step : ""}`),
    });

    expect(mocks.scrapeJobAd).toHaveBeenCalledWith("https://example.com/job");
    expect(diffs).toEqual([]);
    expect(events).toEqual([
      "status:scraping",
      "status:extracting",
      "status:tailoring",
      "diff:",
    ]);
  });

  it("uses raw text when no url given (no scrape)", async () => {
    mocks.extractRequirements.mockResolvedValue({
      must_have: [],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: () => {},
    });

    expect(mocks.scrapeJobAd).not.toHaveBeenCalled();
    expect(mocks.extractRequirements).toHaveBeenCalledWith("paste me");
  });

  it("emits an error event when scrape fails", async () => {
    const errors: string[] = [];
    mocks.scrapeJobAd.mockRejectedValue(new Error("blocked"));

    await expect(
      runTailorPipeline({
        request: { jobUrl: "https://example.com/job" },
        cv: {},
        onEvent: (e) => {
          if (e.type === "error") errors.push(e.message);
        },
      }),
    ).resolves.toEqual([]);

    expect(errors.some((m) => m.includes("blocked"))).toBe(true);
  });

  it("continues with empty requirements when extraction fails", async () => {
    const events: string[] = [];
    mocks.extractRequirements.mockRejectedValue(new Error("parse boom"));
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: (e) =>
        events.push(`${e.type}:${e.type === "status" ? e.step : ""}`),
    });

    expect(mocks.extractRequirements).toHaveBeenCalledWith("paste me");
    expect(mocks.buildTailorDiffs).toHaveBeenCalledWith(
      expect.objectContaining({
        cv: {},
        requirements: { must_have: [], nice_to_have: [], responsibilities: [] },
      }),
    );
    expect(events).toEqual(["status:extracting", "status:tailoring", "diff:"]);
    expect(events.some((e) => e.startsWith("error"))).toBe(false);
  });

  it("emits an error event when the tailor stage fails", async () => {
    const errors: string[] = [];
    mocks.extractRequirements.mockResolvedValue({
      must_have: [],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockRejectedValue(new Error("llm down"));

    await expect(
      runTailorPipeline({
        request: { jobText: "paste me" },
        cv: {},
        onEvent: (e) => {
          if (e.type === "error") errors.push(e.message);
        },
      }),
    ).resolves.toEqual([]);

    expect(errors.some((m) => m.includes("llm down"))).toBe(true);
  });
});
