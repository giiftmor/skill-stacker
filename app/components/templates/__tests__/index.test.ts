import { describe, expect, it } from "vitest";
import type { TemplatePreviewProps } from "../index";
import { getClassicSections, getTemplateSections } from "../index";

const mockProps: TemplatePreviewProps = {
  personal: {
    fullName: "John Doe",
    title: "Developer",
    phone: "123",
    email: "john@test.com",
    location: "NYC",
    linkedin: "john",
  },
  profile: "A profile summary",
  competency: ["JavaScript", "TypeScript", "React"],
  experiences: [
    {
      id: 1,
      company: "Acme",
      role: "Engineer",
      period: "2020-2023",
      details: "Built things",
    },
  ],
  education: [
    { id: 1, institution: "MIT", qualification: "BSc", period: "2016-2020" },
  ],
  certificate: [{ id: 1, name: "AWS CP", date: "2022" }],
  skill: ["React", "Node"],
  reference: [
    {
      id: 1,
      name: "Jane",
      company: "Acme",
      role: "Manager",
      email: "jane@acme.com",
      phone: "456",
    },
  ],
  additionalInfo: ["Some info"],
  colors: {
    primary: "#2563eb",
    secondary: "#1e40af",
    accent: "#3b82f6",
    text: "#1f2937",
    background: "#ffffff",
  },
  fontPair: { heading: "Arial, sans-serif", body: "Arial, sans-serif" },
};

describe("getTemplateSections", () => {
  it("returns classic sections by default", () => {
    const result = getTemplateSections("classic", mockProps);
    expect(result.main).toBeDefined();
    expect(result.main.length).toBeGreaterThan(0);
    expect(result.sidebar).toBeUndefined();
  });

  it("returns all known template IDs without error", () => {
    const ids = [
      "classic",
      "executive",
      "modern",
      "minimal",
      "creative",
      "twoColumn",
      "academic",
    ];
    for (const id of ids) {
      const result = getTemplateSections(id, mockProps);
      expect(result.main.length).toBeGreaterThan(0);
    }
  });

  it("falls back to classic for unknown template", () => {
    const result = getTemplateSections("unknown", mockProps);
    expect(result.main.length).toBeGreaterThan(0);
  });

  it("returns sidebar sections for twoColumn template", () => {
    const result = getTemplateSections("twoColumn", mockProps);
    expect(result.sidebar).toBeDefined();
    expect(result.sidebar?.length).toBeGreaterThan(0);
  });
});

describe("getClassicSections", () => {
  it("includes a header section", () => {
    const result = getClassicSections(mockProps);
    const header = result.main.find((s) => s.key === "header");
    expect(header).toBeDefined();
  });

  it("each section has required fields", () => {
    const result = getClassicSections(mockProps);
    for (const section of result.main) {
      expect(section.key).toBeTruthy();
      expect(section.estimatedHeight).toBeGreaterThan(0);
      expect(typeof section.canBreak).toBe("boolean");
      expect(section.content).toBeDefined();
    }
  });
});
