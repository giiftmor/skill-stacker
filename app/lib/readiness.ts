export type SectionKey =
  | "personal" | "profile" | "competency" | "experiences" | "education"
  | "certificate" | "skill" | "reference" | "additionalInfo";

export type SectionState = "none" | "partial" | "full";

export interface SectionReadiness {
  key: SectionKey;
  label: string;
  state: SectionState;
}

export interface CVReadiness {
  percent: number;
  sections: SectionReadiness[];
}

export const SECTION_KEYS: SectionKey[] = [
  "personal", "profile", "competency", "experiences", "education",
  "certificate", "skill", "reference", "additionalInfo",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  personal: "Personal information",
  profile: "Professional profile",
  competency: "Core competencies",
  experiences: "Work experience",
  education: "Education & qualifications",
  certificate: "Certificates & licenses",
  skill: "Technical competencies",
  reference: "References",
  additionalInfo: "Additional information",
};

function filled<T>(
  items: T[] | undefined,
  ok: (item: T) => boolean,
): number {
  return (items ?? []).filter(ok).length;
}

const nonEmpty = (s: string | undefined | null): string =>
  (s ?? "").trim();

function filledStrings(items: unknown[] | undefined): number {
  return (items ?? []).filter(
    (i) => typeof i === "string" && i.trim() !== "",
  ).length;
}

export function sectionReadiness(
  key: SectionKey,
  data: Record<string, unknown>,
): SectionState {
  switch (key) {
    case "personal": {
      const p = data.personal as
        | { fullName?: string; title?: string; phone?: string; email?: string; location?: string; linkedin?: string }
        | null
        | undefined;
      if (!p || (!nonEmpty(p.fullName) && !nonEmpty(p.title))) return "none";
      const count = [p.fullName, p.title, p.email, p.phone, p.location, p.linkedin].filter(Boolean).length;
      return count >= 3 ? "full" : "partial";
    }
    case "profile": {
      const len = nonEmpty(data.profile as string).length;
      if (len === 0) return "none";
      return len >= 40 ? "full" : "partial";
    }
    case "competency":
    case "skill": {
      const n = filledStrings(data[key] as unknown[]);
      if (n === 0) return "none";
      return n >= 3 ? "full" : "partial";
    }
    case "experiences": {
      const rows = data.experiences as
        | Array<{ company?: string; details?: string }>
        | undefined;
      const n = filled(rows, (e) => nonEmpty(e.company) !== "" && nonEmpty(e.details) !== "");
      if (n === 0) return "none";
      return n >= 2 ? "full" : "partial";
    }
    case "education": {
      const rows = data.education as
        | Array<{ institution?: string; qualification?: string }>
        | undefined;
      if (filled(rows, (e) => nonEmpty(e.institution) !== "") === 0) return "none";
      return (rows ?? []).some((e) => nonEmpty(e.qualification) !== "") ? "full" : "partial";
    }
    case "certificate": {
      const rows = data.certificate as Array<{ name?: string }> | undefined;
      return filled(rows, (c) => nonEmpty(c.name) !== "") >= 1 ? "full" : "none";
    }
    case "reference": {
      const rows = data.reference as Array<{ name?: string }> | undefined;
      return filled(rows, (r) => nonEmpty(r.name) !== "") >= 1 ? "full" : "none";
    }
    case "additionalInfo": {
      return filledStrings(data.additionalInfo as unknown[]) >= 1 ? "full" : "none";
    }
  }
}

export function cvReadiness(data: Record<string, unknown>): CVReadiness {
  const sections = SECTION_KEYS.map((key) => ({
    key,
    label: SECTION_LABELS[key],
    state: sectionReadiness(key, data),
  }));
  const weights: Record<SectionState, number> = { none: 0, partial: 0.5, full: 1 };
  const total = sections.reduce((sum, s) => sum + weights[s.state], 0);
  return { percent: Math.round((total / sections.length) * 100), sections };
}

export function hasFlagsToSections(
  flags: Partial<Record<SectionKey, boolean>>,
): SectionKey[] {
  return SECTION_KEYS.filter((key) => flags[key] === true);
}

export function readinessFromSections(sections: SectionKey[]): number {
  return Math.round((sections.length / SECTION_KEYS.length) * 100);
}