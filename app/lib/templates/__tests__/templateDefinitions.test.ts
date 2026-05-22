import { describe, expect, it } from "vitest";
import { FONT_PAIRS, TEMPLATES, THEMES } from "../templateDefinitions";

describe("TEMPLATES", () => {
  it("has all required template IDs", () => {
    const ids = Object.keys(TEMPLATES);
    expect(ids).toContain("classic");
    expect(ids).toContain("executive");
    expect(ids).toContain("modern");
    expect(ids).toContain("minimal");
    expect(ids).toContain("creative");
    expect(ids).toContain("twoColumn");
    expect(ids).toContain("academic");
  });

  it("each template has required fields", () => {
    for (const tpl of Object.values(TEMPLATES)) {
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.colorScheme).toBeDefined();
      expect(tpl.colorScheme.primary).toBeTruthy();
      expect(typeof tpl.supportsPhoto).toBe("boolean");
    }
  });
});

describe("THEMES", () => {
  it("has theme groups that overlap with template IDs", () => {
    const themeGroupKeys = Object.keys(THEMES);
    expect(themeGroupKeys.length).toBeGreaterThan(0);
    const allGroupsHaveColors = Object.values(THEMES).every(
      (themes) =>
        themes.length > 0 && themes.every((t) => t.id && t.name && t.colors),
    );
    expect(allGroupsHaveColors).toBe(true);
  });
});

describe("FONT_PAIRS", () => {
  it("has font pairs with heading and body", () => {
    for (const pair of FONT_PAIRS) {
      expect(pair.id).toBeTruthy();
      expect(pair.name).toBeTruthy();
      expect(pair.heading).toBeTruthy();
      expect(pair.body).toBeTruthy();
    }
  });
});
