// app/lib/templates/pdfStyles.ts - Per-template PDF styles
import { StyleSheet } from "@react-pdf/renderer";
import { TEMPLATES, THEMES, FONT_PAIRS, TemplateId } from "./templateDefinitions";

export interface PDFStyleSheet {
  page: Record<string, unknown>;
  header: Record<string, unknown>;
  headerDark?: Record<string, unknown>;
  name: Record<string, unknown>;
  title: Record<string, unknown>;
  section: Record<string, unknown>;
  sectionTitle: Record<string, unknown>;
  text: Record<string, unknown>;
  bulletPoint: Record<string, unknown>;
  sidebar?: Record<string, unknown>;
  mainContent?: Record<string, unknown>;
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
    heading: pair?.heading || "Helvetica",
    body: pair?.body || "Helvetica",
  };
}

export function createClassicStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("classic", themeId);
  const fontPairId = themeId || "default";
  const fonts = getFonts(fontPairId);

  return StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${colors.accent}` },
    name: { fontSize: 32, fontWeight: "bold", color: colors.primary, marginBottom: 4 },
    title: { textTransform: "uppercase", fontSize: 12, color: colors.secondary, marginBottom: 6 },
    section: { marginTop: 15, marginBottom: 10 },
    sectionTitle: { textTransform: "uppercase", fontSize: 13, fontWeight: "bold", color: colors.primary, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${colors.accent}` },
    text: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
  });
}

export function createExecutiveStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("executive", themeId);
  const fonts = getFonts(themeId || "default");

  return StyleSheet.create({
    page: { padding: 0, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { padding: 24, marginBottom: 20 },
    headerDark: { backgroundColor: colors.primary, padding: 24, marginBottom: 20 },
    name: { fontSize: 28, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
    title: { fontSize: 14, color: colors.accent, marginBottom: 8 },
    section: { padding: 0, marginTop: 15, marginBottom: 10, marginHorizontal: 40 },
    sectionTitle: { textTransform: "uppercase", fontSize: 12, fontWeight: "bold", color: colors.accent, marginBottom: 8, borderBottom: `1px solid ${colors.accent}` },
    text: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
  });
}

export function createModernStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("modern", themeId);
  const fonts = getFonts(themeId || "default");

  return StyleSheet.create({
    page: { padding: 0, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20 },
    name: { fontSize: 26, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
    title: { fontSize: 12, color: colors.accent, textTransform: "uppercase" },
    section: { padding: 20, marginTop: 15, marginBottom: 10 },
    sectionTitle: { backgroundColor: colors.accent, color: "#ffffff", fontSize: 12, fontWeight: "bold", padding: "6 12", marginBottom: 12, textTransform: "uppercase" },
    text: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
  });
}

export function createTwoColumnStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("twoColumn", themeId);
  const fonts = getFonts(themeId || "default");

  return StyleSheet.create({
    page: { padding: 0, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { flexDirection: "row", padding: 0 },
    name: { fontSize: 24, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
    title: { fontSize: 11, color: colors.accent, textTransform: "uppercase" },
    section: { marginTop: 15, marginBottom: 10 },
    sectionTitle: { fontSize: 11, fontWeight: "bold", color: colors.accent, marginBottom: 8, borderBottom: `1px solid ${colors.accent}`, textTransform: "uppercase" },
    text: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
    sidebar: { width: 180, backgroundColor: colors.primary, padding: 15 },
    mainContent: { flex: 1, padding: 20 },
  });
}

export function createAcademicStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("academic", themeId);
  const fonts = getFonts(themeId || "default");

  return StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { borderBottom: `3px solid ${colors.accent}`, paddingBottom: 12, marginBottom: 20 },
    name: { fontSize: 26, fontWeight: "bold", color: colors.primary, marginBottom: 8 },
    title: { fontSize: 12, color: colors.secondary, textTransform: "uppercase" },
    section: { marginTop: 15, marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: "bold", color: colors.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
    text: { fontSize: 10, lineHeight: 1.6, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
  });
}

export function createCreativeStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("creative", themeId);
  const fonts = getFonts(themeId || "default");

  return StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { marginBottom: 20 },
    name: { fontSize: 28, fontWeight: "bold", color: colors.primary, marginBottom: 4 },
    title: { fontSize: 14, color: colors.secondary },
    section: { marginTop: 15, marginBottom: 10 },
    sectionTitle: { backgroundColor: colors.accent, color: "#ffffff", fontSize: 13, fontWeight: "bold", padding: "8 16", marginBottom: 12 },
    text: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
  });
}

export function createMinimalStyles(themeId?: string): PDFStyleSheet {
  const colors = getColors("minimal", themeId);
  const fonts = getFonts(themeId || "default");

  return StyleSheet.create({
    page: { padding: 50, fontSize: 11, fontFamily: fonts.body, backgroundColor: colors.background },
    header: { marginBottom: 30 },
    name: { fontSize: 36, fontWeight: "bold", color: colors.primary, marginBottom: 8 },
    title: { fontSize: 14, color: colors.secondary, marginBottom: 10 },
    section: { marginTop: 20, marginBottom: 15 },
    sectionTitle: { fontSize: 11, fontWeight: "bold", color: colors.primary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 },
    text: { fontSize: 11, lineHeight: 1.6, marginBottom: 6, color: colors.text },
    bulletPoint: { fontSize: 11, marginLeft: 0, marginBottom: 6, color: colors.text },
  });
}

export function getPDFStyleSheet(templateId: TemplateId, themeId?: string, fontPairId?: string): PDFStyleSheet {
  const creators: Record<string, (themeId?: string) => PDFStyleSheet> = {
    classic: createClassicStyles,
    executive: createExecutiveStyles,
    modern: createModernStyles,
    twoColumn: createTwoColumnStyles,
    academic: createAcademicStyles,
    creative: createCreativeStyles,
    minimal: createMinimalStyles,
  };

  const creator = creators[templateId] || createClassicStyles;
  return creator(themeId);
}