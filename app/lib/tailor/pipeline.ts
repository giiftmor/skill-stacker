import { scrapeJobAd } from "./scrape";
import { extractRequirements } from "./extract";
import { buildTailorDiffs } from "./tailor";
import type { JobRequirements, TailorDiff } from "./types";

export interface TailorRequest {
  jobUrl?: string;
  jobText?: string;
  cv?: Record<string, unknown>;
}

export type TailorEvent =
  | { type: "status"; step: "scraping" | "extracting" | "tailoring" }
  | { type: "error"; message: string }
  | { type: "diff"; diffs: TailorDiff[] };

export async function runTailorPipeline(args: {
  request: TailorRequest;
  cv: Record<string, unknown>;
  onEvent: (e: TailorEvent) => void;
}): Promise<TailorDiff[]> {
  const { request, cv, onEvent } = args;

  try {
    let jobText = request.jobText ?? "";
    if (request.jobUrl) {
      onEvent({ type: "status", step: "scraping" });
      jobText = await scrapeJobAd(request.jobUrl);
    }

    onEvent({ type: "status", step: "extracting" });
    let requirements: JobRequirements;
    try {
      requirements = await extractRequirements(jobText);
    } catch {
      requirements = { must_have: [], nice_to_have: [], responsibilities: [] };
    }

    onEvent({ type: "status", step: "tailoring" });
    const diffs = await buildTailorDiffs({ cv, requirements });

    onEvent({ type: "diff", diffs });
    return diffs;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onEvent({ type: "error", message });
    return [];
  }
}
