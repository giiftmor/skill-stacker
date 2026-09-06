import { describe, expect, it, vi } from "vitest";
import { guardNoFabrication, buildTailorDiffs } from "../tailor";
import type { JobRequirements } from "../types";

describe("guardNoFabrication", () => {
  it("accepts a faithful paraphrase", () => {
    const ok = guardNoFabrication(
      "I led a team of 5 engineers building React dashboards.",
      "I built React dashboards with a team of 5 engineers.",
    );
    expect(ok.ok).toBe(true);
  });

  it("rejects invented tokens like new skills", () => {
    const out = guardNoFabrication(
      "I built web apps with JavaScript.",
      "I built performance-critical web apps with JavaScript and Kubernetes.",
    );
    expect(out.ok).toBe(false);
    expect(out.reason).toContain("kubernetes");
  });

  it("ignores common stopwords", () => {
    const out = guardNoFabrication(
      "I have experience with React.",
      "I have years of experience with React.",
    );
    expect(out.ok).toBe(true);
  });
});

describe("buildTailorDiffs", () => {
  const requirements: JobRequirements = {
    must_have: ["React"],
    nice_to_have: [],
    responsibilities: [],
  };
  const chatFn = vi.fn().mockResolvedValue("I led teams shipping React products.");

  it("returns a changed diff for a rewritten profile", async () => {
    const cv = { profile: "I worked on React." };
    const diffs = await buildTailorDiffs({ cv, requirements, chatFn });
    const profileDiff = diffs.find((d) => d.section === "profile");
    expect(profileDiff).toBeDefined();
    expect(profileDiff!.status).toBe("changed");
    expect(profileDiff!.original).toBe("I worked on React.");
    expect(chatFn).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining("I worked on React.") }));
  });

  it("skips empty sections", async () => {
    const cv = { profile: "" };
    const diffs = await buildTailorDiffs({ cv, requirements, chatFn });
    expect(diffs.filter((d) => d.section === "profile")).toHaveLength(0);
  });
});
