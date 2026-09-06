import { describe, expect, it } from "vitest";
import { getTemplateClasses } from "../tailwindStyles";
import { TEMPLATES, THEMES } from "../templateDefinitions";

describe("getTemplateClasses", () => {
  it("returns empty string for unknown template", () => {
    expect(getTemplateClasses("nonexistent")).toBe("");
  });

  it("includes the template's default primary color", () => {
    const result = getTemplateClasses("classic");
    expect(result).toContain(TEMPLATES.classic.colorScheme.primary);
    expect(result).toContain(".cv-preview");
  });

  it("applies a theme override when a valid themeId is given", () => {
    const themeGroup = Object.values(THEMES).find((g) => g.length > 0);
    const theme = themeGroup?.[0];
    if (!theme) return;
    const result = getTemplateClasses("classic", theme.id);
    expect(result).toContain(theme.colors.primary);
  });

  it("ignores an invalid themeId and keeps defaults", () => {
    const result = getTemplateClasses("classic", "not-a-real-theme");
    expect(result).toContain(TEMPLATES.classic.colorScheme.primary);
  });

  it("returns a two-column layout for the twoColumn template", () => {
    const result = getTemplateClasses("twoColumn");
    expect(result).toContain(".cv-preview");
  });
});
