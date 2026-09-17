import { describe, expect, it, vi } from "vitest";
import { buildTailorDiffs, guardNoFabrication } from "../tailor";
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

  it("logs guard violations when the model invents facts", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) =>
      logs.push(String(a[0])),
    );
    const d = {
      key: "profile",
      section: "profile" as const,
      label: "Profile",
      original: "I know React.",
      proposed: "I know React and Kubernetes.",
      status: "changed" as const,
    };
    guardNoFabrication(d.original, d.proposed);
    expect(logs.join("\n")).toContain("[tailor.guard]");
  });
});

describe("buildTailorDiffs", () => {
  const requirements: JobRequirements = {
    must_have: ["React"],
    nice_to_have: [],
    responsibilities: [],
  };
  const chatFn = vi
    .fn()
    .mockResolvedValue("I led teams shipping React products.");

  it("returns a changed diff for a rewritten profile", async () => {
    const cv = { profile: "I worked on React." };
    const diffs = await buildTailorDiffs({ cv, requirements, chatFn });
    const profileDiff = diffs.find((d) => d.section === "profile");
    expect(profileDiff).toBeDefined();
    if (!profileDiff) return;
    expect(profileDiff.status).toBe("changed");
    expect(profileDiff.original).toBe("I worked on React.");
    expect(chatFn).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("I worked on React."),
      }),
    );
  });

  it("skips empty sections", async () => {
    const cv = { profile: "" };
    const diffs = await buildTailorDiffs({ cv, requirements, chatFn });
    expect(diffs.filter((d) => d.section === "profile")).toHaveLength(0);
  });

  it("emits onSection start/done for each tailored section", async () => {
    const events: Array<{ status: string; key: string; label: string }> = [];
    const cv = {
      profile: "I worked on React.",
      experiences: [
        { id: 1, company: "Acme", role: "Dev", details: "Made things." },
      ],
      skill: ["React"],
      competency: ["Leadership"],
    };
    await buildTailorDiffs({
      cv,
      requirements,
      chatFn,
      onSection: (status, key, label) => events.push({ status, key, label }),
    });

    expect(events.map((e) => e.status)).toEqual([
      "start",
      "done",
      "start",
      "done",
      "start",
      "done",
      "start",
      "done",
    ]);
    expect(events[0]).toMatchObject({ key: "profile", label: "Profile" });
    expect(events[2]).toMatchObject({
      key: "experience:1",
      label: "Acme — Dev",
    });
    expect(events[4]).toMatchObject({ key: "skill", label: "Skills" });
    expect(events[6]).toMatchObject({
      key: "competency",
      label: "Competencies",
    });
  });

  it("does not emit onSection for empty sections", async () => {
    const events: string[] = [];
    const cv = { profile: "" };
    await buildTailorDiffs({
      cv,
      requirements,
      chatFn,
      onSection: (status) => events.push(status),
    });
    expect(events).toEqual([]);
  });

  it("logs per-section tailoring with lengths", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) =>
      logs.push(String(a[0])),
    );
    const out = await buildTailorDiffs({
      cv: { profile: "Experienced engineer with React." },
      requirements: {
        must_have: ["React"],
        nice_to_have: [],
        responsibilities: [],
      },
      chatFn,
    });
    expect(out).toHaveLength(1);
    expect(logs.join("\n")).toContain("[tailor.rewrite]");
  });
});
