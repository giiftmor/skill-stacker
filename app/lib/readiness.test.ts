import { describe, expect, it } from "vitest";
import {
  cvReadiness, hasFlagsToSections, readinessFromSections,
  sectionReadiness, SECTION_KEYS,
} from "./readiness";

const empty = () => ({
  personal: { fullName: "", title: "", phone: "", email: "", location: "", linkedin: "" },
  profile: "", competency: [], experiences: [], education: [],
  certificate: [], skill: [], reference: [], additionalInfo: [],
});

describe("sectionReadiness", () => {
  it("personal: none when name and title absent", () => {
    expect(sectionReadiness("personal", empty())).toBe("none");
  });
  it("personal: partial with one field filled, full with three", () => {
    const d = { ...empty(), personal: { ...empty().personal, fullName: "Ada Lovelace" } };
    expect(sectionReadiness("personal", d)).toBe("partial");
    const d2 = { ...empty(), personal: { fullName: "Ada Lovelace", title: "Engineer", email: "a@b.c" } };
    expect(sectionReadiness("personal", d2)).toBe("full");
  });
  it("profile: none empty, partial <40 chars, full >=40", () => {
    expect(sectionReadiness("profile", empty())).toBe("none");
    expect(sectionReadiness("profile", { ...empty(), profile: "short" })).toBe("partial");
    expect(sectionReadiness("profile", { ...empty(), profile: "x".repeat(40) })).toBe("full");
  });
  it("competency/skill: 3+ entries is full, 1-2 partial, 0 none", () => {
    expect(sectionReadiness("competency", { ...empty(), competency: ["a", "b"] })).toBe("partial");
    expect(sectionReadiness("competency", { ...empty(), competency: ["a", "b", "c"] })).toBe("full");
    expect(sectionReadiness("skill", { ...empty(), skill: [] })).toBe("none");
  });
  it("experiences: 2+ with company+details is full", () => {
    const one = [{ id: "1", company: "C", role: "R", period: "", details: "did things" }];
    expect(sectionReadiness("experiences", { ...empty(), experiences: one })).toBe("partial");
    expect(sectionReadiness("experiences", { ...empty(), experiences: [...one, { id: "2", company: "D", role: "", period: "", details: "more" }] })).toBe("full");
  });
  it("education: institution present; full when qualification too", () => {
    expect(sectionReadiness("education", { ...empty(), education: [{ id: "1", institution: "MIT", qualification: "", period: "" }] })).toBe("partial");
    expect(sectionReadiness("education", { ...empty(), education: [{ id: "1", institution: "MIT", qualification: "BSc", period: "" }] })).toBe("full");
  });
  it("certificate and reference are binary (full/none)", () => {
    expect(sectionReadiness("certificate", { ...empty(), certificate: [{ id: "1", name: "PMP", date: "" }] })).toBe("full");
    expect(sectionReadiness("reference", { ...empty(), reference: [] })).toBe("none");
  });
  it("additionalInfo: any entry is full", () => {
    expect(sectionReadiness("additionalInfo", { ...empty(), additionalInfo: ["Driven"] })).toBe("full");
  });
  it("handles missing/null sections without throwing", () => {
    expect(sectionReadiness("experiences", {})).toBe("none");
    expect(sectionReadiness("personal", { personal: null })).toBe("none");
  });
});

describe("cvReadiness", () => {
  it("empty CV scores 0", () => {
    expect(cvReadiness(empty()).percent).toBe(0);
  });
  it("all sections full scores 100", () => {
    const full = {
      ...empty(),
      personal: { fullName: "Ada", title: "Engineer", email: "a@b.c", phone: "1", location: "X", linkedin: "in/a" },
      profile: "x".repeat(40),
      competency: ["a", "b", "c"],
      experiences: [{ id: "1", company: "C", role: "R", period: "", details: "p" }, { id: "2", company: "D", role: "", period: "", details: "q" }],
      education: [{ id: "1", institution: "MIT", qualification: "BSc", period: "" }],
      certificate: [{ id: "1", name: "PMP", date: "" }],
      skill: ["s1", "s2", "s3"],
      reference: [{ id: "1", name: "R", company: "", role: "", email: "", phone: "" }],
      additionalInfo: ["Driven"],
    };
    expect(cvReadiness(full).percent).toBe(100);
  });
  it("halves count partial sections", () => {
    const d = { ...empty(), profile: "short", skill: ["one"] };
    const r = cvReadiness(d);
    expect(r.percent).toBeGreaterThan(0);
    expect(r.percent).toBeLessThan(50);
  });
});

describe("readinessFromSections / hasFlagsToSections", () => {
  it("maps presence flags to an ordered section list", () => {
    const flags = { profile: true, skill: true, personal: true };
    expect(hasFlagsToSections(flags)).toEqual(["personal", "profile", "skill"]);
  });
  it("computes percent from presence", () => {
    expect(readinessFromSections([])).toBe(0);
    expect(readinessFromSections(SECTION_KEYS)).toBe(100);
  });
});