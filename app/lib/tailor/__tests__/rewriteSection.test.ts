import { describe, expect, it } from "vitest";
import { rewriteSection } from "../tailor";

const chatFn = async (): Promise<string> =>
  "Built a resume tool in TypeScript and SQL.";

describe("rewriteSection", () => {
  it("returns a proposed rewrite and a passing guard for faithful text", async () => {
    const original = "Built resume tool. TypeScript. SQL.";
    const result = await rewriteSection({
      section: "profile",
      original,
      chatFn,
    });
    expect(result.proposed).not.toBe("");
    expect(result.guard.ok).toBe(true);
  });

  it("flags fabricated facts via the guard", async () => {
    const lyingFn = async (): Promise<string> =>
      "Won the Nobel Prize for building a rocket to Mars.";
    const result = await rewriteSection({
      section: "profile",
      original: "Built resume tool. TypeScript. SQL.",
      chatFn: lyingFn,
    });
    expect(result.guard.ok).toBe(false);
    expect(result.guard.reason).toMatch(/Nobel|rocket|Mars/);
  });

  it("uses sourceText as the guard basis for empty originals (draft mode)", async () => {
    const source = "Ada Lovelace. Analytical Engine programmer. 1843.";
    const draftFn = async (): Promise<string> =>
      "Ada Lovelace is a programmer who worked on the Analytical Engine in 1843.";
    const result = await rewriteSection({
      section: "profile",
      original: "",
      sourceText: source,
      chatFn: draftFn,
    });
    expect(result.guard.ok).toBe(true);
  });
});
