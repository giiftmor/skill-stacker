import { chat, llmConfig } from "../llm";
import { logger } from "../log";
import type { JobRequirements, TailorDiff } from "./types";

const STOPWORDS = new Set(
  "the,to,of,and,or,for,with,from,that,this,my,years,experience,work,worked,working,built,building,team,teams,projects,project,product,products,web,application,applications,application,".split(
    ",",
  ),
);

export function guardNoFabrication(
  original: string,
  proposed: string,
): { ok: boolean; reason?: string } {
  const srcTokens = new Set(
    original
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/gi, "")),
  );
  const invented: string[] = [];
  for (const word of proposed.split(/\s+/)) {
    const w = word.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    if (!srcTokens.has(w) && !invented.includes(w)) invented.push(w);
  }
  if (invented.length) {
    logger.info("tailor.guard", "violation", {
      invented: invented.slice(0, 5),
    });
    return {
      ok: false,
      reason: `May introduce facts not in your CV: ${invented.slice(0, 5).join(", ")}`,
    };
  }
  return { ok: true };
}

const SYSTEM =
  "You are a CV tailoring assistant. Rewrite the ORIGINAL text so it better matches the JOB REQUIREMENTS. " +
  "You may paraphrase, reorder, and emphasize existing content only. " +
  "You MUST NOT invent any fact, skill, company name, number, tool, or claim that is not already in the ORIGINAL text. " +
  "Return only the rewritten text, no preamble.";

export async function tailorSection(args: {
  section: string;
  original: string;
  requirements: JobRequirements;
  chatFn?: typeof chat;
}): Promise<{ original: string; proposed: string }> {
  const run = args.chatFn ?? chat;
  const { tailorModel } = llmConfig();
  const reqText = [
    ...args.requirements.must_have.map((r) => `- MUST: ${r}`),
    ...args.requirements.nice_to_have.map((r) => `- NICE: ${r}`),
    ...args.requirements.responsibilities.map((r) => `- RESP: ${r}`),
  ].join("\n");

  const prompt = `JOB REQUIREMENTS:\n${reqText}\n\nORIGINAL (${args.section}):\n${args.original}\n\nREWRITE:`;
  const t0 = Date.now();
  logger.info("tailor.rewrite", "start", {
    section: args.section,
    originalChars: args.original.length,
  });
  const proposed = await run({ model: tailorModel, system: SYSTEM, prompt });
  logger.info("tailor.rewrite", "done", {
    section: args.section,
    ms: Date.now() - t0,
    proposedChars: proposed.trim().length,
  });
  return { original: args.original, proposed: proposed.trim() };
}

export async function buildTailorDiffs(args: {
  cv: Record<string, unknown>;
  requirements: JobRequirements;
  chatFn?: typeof chat;
  onSection?: (status: "start" | "done", key: string, label: string) => void;
}): Promise<TailorDiff[]> {
  const run = args.chatFn;
  const diffs: TailorDiff[] = [];

  const profile = (args.cv.profile as string | undefined) ?? "";
  if (profile.trim()) {
    args.onSection?.("start", "profile", "Profile");
    const { original, proposed } = await tailorSection({
      section: "profile",
      original: profile,
      requirements: args.requirements,
      chatFn: run,
    });
    args.onSection?.("done", "profile", "Profile");
    diffs.push({
      key: "profile",
      section: "profile",
      label: "Profile",
      original,
      proposed,
      status: original === proposed ? "original" : "changed",
    });
  }

  const experiences =
    (args.cv.experiences as Array<Record<string, unknown>> | undefined) ?? [];
  for (const exp of experiences) {
    const details = (exp.details as string | undefined) ?? "";
    if (!details.trim()) continue;
    const id =
      (exp.id as string | number | undefined) ??
      `${Math.random().toString(36).slice(2)}`;
    const label =
      `${(exp.company as string) || ""} — ${(exp.role as string) || "Experience"}`.trim();
    const key = `experience:${id}`;
    args.onSection?.("start", key, label);
    const { original, proposed } = await tailorSection({
      section: `experience ${label}`,
      original: details,
      requirements: args.requirements,
      chatFn: run,
    });
    args.onSection?.("done", key, label);
    diffs.push({
      key,
      section: "experience",
      label: label || "Experience",
      original,
      proposed,
      status: original === proposed ? "original" : "changed",
    });
  }

  const skill = (args.cv.skill as string[] | undefined) ?? [];
  if (skill.some((s) => s.trim())) {
    const original = skill.join("\n");
    args.onSection?.("start", "skill", "Skills");
    const { proposed } = await tailorSection({
      section: "skills",
      original,
      requirements: args.requirements,
      chatFn: run,
    });
    args.onSection?.("done", "skill", "Skills");
    const normalized = proposed
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const deduped = [...new Set(normalized)].slice(0, skill.length);
    diffs.push({
      key: "skill",
      section: "skill",
      label: "Skills",
      original,
      proposed: deduped.join("\n"),
      status:
        JSON.stringify(deduped) === JSON.stringify(skill)
          ? "original"
          : "changed",
    });
  }

  const competency = (args.cv.competency as string[] | undefined) ?? [];
  if (competency.some((c) => c.trim())) {
    const original = competency.join("\n");
    args.onSection?.("start", "competency", "Competencies");
    const { proposed } = await tailorSection({
      section: "competencies",
      original,
      requirements: args.requirements,
      chatFn: run,
    });
    args.onSection?.("done", "competency", "Competencies");
    const normalized = proposed
      .split(/[\n,]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    const deduped = [...new Set(normalized)].slice(0, competency.length);
    diffs.push({
      key: "competency",
      section: "competency",
      label: "Competencies",
      original,
      proposed: deduped.join("\n"),
      status:
        JSON.stringify(deduped) === JSON.stringify(competency)
          ? "original"
          : "changed",
    });
  }

  return diffs;
}
