import type { Experience } from "../../types/global";

export function applyExperienceUpdates(
  prev: Experience[],
  updates: Array<{ id?: string | number; details: string }>,
): Experience[] {
  const byId = new Map<string, string>();
  for (const update of updates) {
    if (update.id !== undefined) byId.set(String(update.id), update.details);
  }

  return prev.map((exp, i) => {
    const matched = byId.get(String(exp.id));
    if (matched !== undefined) return { ...exp, details: matched };
    const positional = updates[i];
    if (positional && positional.id === undefined) {
      return { ...exp, details: positional.details };
    }
    return exp;
  });
}
