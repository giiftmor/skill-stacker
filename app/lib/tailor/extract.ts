import { chat, llmConfig } from "../llm";
import { logger } from "../log";
import { parseJsonObject } from "./json";
import type { JobRequirements } from "./types";

const SYSTEM =
  "You extract job requirements from a job advert. " +
  "Return ONLY a JSON object with exactly these keys: " +
  '{"must_have": string[], "nice_to_have": string[], "responsibilities": string[]}. ' +
  "Do not add keys, do not explain, do not wrap in markdown.";

export async function extractRequirements(
  jobText: string,
): Promise<JobRequirements> {
  const { extractModel } = llmConfig();
  const prompt = `Job advert text:\n\n${jobText}`;
  const t0 = Date.now();
  logger.info("tailor.extract", "request", {
    model: extractModel,
    chars: jobText.length,
  });
  const raw = await chat({ model: extractModel, system: SYSTEM, prompt });

  let parsed: Partial<JobRequirements>;
  let parseOk = true;
  try {
    parsed = parseJsonObject<Partial<JobRequirements>>(raw);
  } catch {
    parsed = {};
    parseOk = false;
  }

  const result = {
    must_have: Array.isArray(parsed.must_have) ? parsed.must_have : [],
    nice_to_have: Array.isArray(parsed.nice_to_have) ? parsed.nice_to_have : [],
    responsibilities: Array.isArray(parsed.responsibilities)
      ? parsed.responsibilities
      : [],
  };
  logger.info("tailor.extract", "done", {
    model: extractModel,
    ms: Date.now() - t0,
    parseOk,
    must: result.must_have.length,
    nice: result.nice_to_have.length,
    resp: result.responsibilities.length,
  });
  return result;
}
