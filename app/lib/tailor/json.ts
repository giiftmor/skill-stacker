export function parseJsonObject<T>(text: string): T {
  let candidate = text.trim();
  candidate = candidate.replace(/```(?:json)?/gi, "").trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse JSON from model output");
  }
  candidate = candidate.slice(start, end + 1);

  return JSON.parse(candidate) as T;
}
