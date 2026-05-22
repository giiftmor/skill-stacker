// app/lib/templates/docxStyles.ts - Per-template DOCX styles
import { Paragraph, TextRun, BorderStyle, AlignmentType, ShadingType } from "docx";
import { TEMPLATES, THEMES, FONT_PAIRS, TemplateId } from "./templateDefinitions";

export interface DocxStyleSheet {
  heading: { bold: boolean; size: number; color: string; font: string };
  subheading: { bold: boolean; size: number; color: string; font: string };
  body: { size: number; color: string; font: string };
  sectionTitle: (text: string) => Paragraph;
}

function getColors(templateId: TemplateId, themeId?: string) {
  const template = TEMPLATES[templateId];
  if (!template) {
    return { primary: "#333333", secondary: "#555555", accent: "#666666", text: "#333333", background: "#ffffff" };
  }
  if (themeId) {
    for (const group of Object.values(THEMES)) {
      const found = group.find((t) => t.id === themeId);
      if (found) return found.colors;
    }
  }
  return template.colorScheme;
}

function getFonts(fontPairId: string) {
  const pair = FONT_PAIRS.find((p) => p.id === fontPairId);
  return {
    heading: pair?.heading || "Arial",
    body: pair?.body || "Arial",
  };
}

export function createClassicDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("classic", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 32, color: colors.primary, font: fonts.heading },
    subheading: { bold: true, size: 24, color: colors.secondary, font: fonts.heading },
    body: { size: 22, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 26, color: colors.primary, font: fonts.heading })],
      border: { bottom: { color: colors.accent, size: 1, style: BorderStyle.SINGLE } },
      spacing: { after: 120, before: 200 },
    }),
  };
}

export function createExecutiveDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("executive", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 40, color: "#ffffff", font: fonts.heading },
    subheading: { bold: false, size: 24, color: colors.accent, font: fonts.heading },
    body: { size: 22, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: colors.accent, font: fonts.heading })],
      spacing: { after: 100, before: 200 },
    }),
  };
}

export function createModernDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("modern", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 36, color: "#ffffff", font: fonts.heading },
    subheading: { bold: false, size: 22, color: colors.accent, font: fonts.body },
    body: { size: 22, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: "#ffffff", font: fonts.heading })],
      shading: { fill: colors.accent, type: ShadingType.SOLID },
      spacing: { after: 100, before: 200 },
    }),
  };
}

export function createTwoColumnDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("twoColumn", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 28, color: "#ffffff", font: fonts.heading },
    subheading: { bold: false, size: 20, color: colors.accent, font: fonts.body },
    body: { size: 22, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, color: colors.accent, font: fonts.heading })],
      border: { bottom: { color: colors.accent, size: 1, style: BorderStyle.SINGLE } },
      spacing: { after: 100, before: 150 },
    }),
  };
}

export function createAcademicDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("academic", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 34, color: colors.primary, font: fonts.heading },
    subheading: { bold: false, size: 22, color: colors.secondary, font: fonts.heading },
    body: { size: 20, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, color: colors.primary, font: fonts.heading, characterSpacing: 50 })],
      border: { bottom: { color: colors.accent, size: 2, style: BorderStyle.SINGLE } },
      spacing: { after: 120, before: 200 },
    }),
  };
}

export function createCreativeDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("creative", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 38, color: colors.primary, font: fonts.heading },
    subheading: { bold: false, size: 24, color: colors.secondary, font: fonts.body },
    body: { size: 22, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: "#ffffff", font: fonts.heading })],
      shading: { fill: colors.accent, type: ShadingType.SOLID },
      spacing: { after: 120, before: 200 },
    }),
  };
}

export function createMinimalDocxStyles(themeId?: string): DocxStyleSheet {
  const colors = getColors("minimal", themeId);
  const fonts = getFonts(themeId || "default");

  return {
    heading: { bold: true, size: 44, color: colors.primary, font: fonts.heading },
    subheading: { bold: false, size: 24, color: colors.secondary, font: fonts.body },
    body: { size: 24, color: colors.text, font: fonts.body },
    sectionTitle: (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, color: colors.primary, font: fonts.heading, characterSpacing: 100 })],
      spacing: { after: 150, before: 250 },
    }),
  };
}

export function getDocxStyleSheet(templateId: TemplateId, themeId?: string, fontPairId?: string): DocxStyleSheet {
  const creators: Record<string, (themeId?: string) => DocxStyleSheet> = {
    classic: createClassicDocxStyles,
    executive: createExecutiveDocxStyles,
    modern: createModernDocxStyles,
    twoColumn: createTwoColumnDocxStyles,
    academic: createAcademicDocxStyles,
    creative: createCreativeDocxStyles,
    minimal: createMinimalDocxStyles,
  };

  const creator = creators[templateId] || createClassicDocxStyles;
  return creator(themeId);
}