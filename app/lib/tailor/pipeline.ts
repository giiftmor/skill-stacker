import { logger } from "../log";
import { extractRequirements } from "./extract";
import { scrapeJobAd } from "./scrape";
import { buildTailorDiffs } from "./tailor";
import type { JobRequirements, TailorDiff } from "./types";

export interface TailorRequest {
  jobUrl?: string;
  jobText?: string;
  cv?: Record<string, unknown>;
}

export type TailorEvent =
  | { type: "status"; step: "scraping" | "extracting" | "tailoring" }
  | { type: "requirements"; requirements: JobRequirements }
  | { type: "section"; status: "start" | "done"; key: string; label: string }
  | { type: "error"; message: string }
  | { type: "diff"; diffs: TailorDiff[] };

export async function runTailorPipeline(args: {
  request: TailorRequest;
  cv: Record<string, unknown>;
  onEvent: (e: TailorEvent) => void;
}): Promise<TailorDiff[]> {
  const { request, cv, onEvent } = args;
  const t0 = Date.now();
  logger.info("tailor.pipeline", "start", {
    hasUrl: Boolean(request.jobUrl),
    hasText: Boolean(request.jobText?.trim()),
  });

  try {
    let jobText = request.jobText ?? "";
    if (request.jobUrl) {
      onEvent({ type: "status", step: "scraping" });
      const t1 = Date.now();
      jobText = await scrapeJobAd(request.jobUrl);
      logger.info("tailor.pipeline", "scraped", {
        url: request.jobUrl,
        chars: jobText.length,
        ms: Date.now() - t1,
      });
    }

    onEvent({ type: "status", step: "extracting" });
    let requirements: JobRequirements;
    try {
      const t2 = Date.now();
      requirements = await extractRequirements(jobText);
      onEvent({ type: "requirements", requirements });
      logger.info("tailor.pipeline", "extracted", {
        must: requirements.must_have.length,
        nice: requirements.nice_to_have.length,
        resp: requirements.responsibilities.length,
        ms: Date.now() - t2,
      });
    } catch {
      requirements = { must_have: [], nice_to_have: [], responsibilities: [] };
    }

    onEvent({ type: "status", step: "tailoring" });
    const t3 = Date.now();
    const diffs = await buildTailorDiffs({
      cv,
      requirements,
      onSection: (status, key, label) =>
        onEvent({ type: "section", status, key, label }),
    });
    logger.info("tailor.pipeline", "tailored", {
      diffCount: diffs.length,
      ms: Date.now() - t3,
    });

    onEvent({ type: "diff", diffs });
    logger.info("tailor.pipeline", "done", {
      diffCount: diffs.length,
      totalMs: Date.now() - t0,
    });
    return diffs;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onEvent({ type: "error", message });
    logger.error(
      "tailor.pipeline",
      "aborted",
      { totalMs: Date.now() - t0 },
      err as Error,
    );
    return [];
  }
}
