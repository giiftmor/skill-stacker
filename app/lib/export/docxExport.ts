// app/lib/export/docxExport.ts - Template-aware DOCX export
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx";
import { TEMPLATES, THEMES, FONT_PAIRS, TemplateId } from "../templates/templateDefinitions";

export interface DocxExportData {
  personal: {
    fullName: string;
    title: string;
    phone: string;
    email: string;
    location: string;
    linkedin: string;
  };
  profile: string;
  competency: string[];
  experiences: Array<{ id?: string | number; company: string; role: string; period: string; details: string }>;
  education: Array<{ id?: string | number; institution: string; qualification: string; period: string }>;
  certificate: Array<{ id?: string | number; name: string; date: string }>;
  skill: string[];
  reference: Array<{ id?: string | number; name: string; company: string; role: string; email: string; phone: string }>;
  additionalInfo: string[];
}

function getThemeColors(templateId: TemplateId, themeId?: string) {
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

function getFontPair(fontPairId: string) {
  return FONT_PAIRS.find((p) => p.id === fontPairId) || FONT_PAIRS[0];
}

function createSectionTitle(text: string, colors: { primary: string; accent: string }) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: colors.primary })],
    border: { bottom: { color: colors.accent, size: 1, style: BorderStyle.SINGLE } },
    spacing: { after: 100, before: 200 },
  });
}

function createBullet(text: string, size: number = 22) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size })],
    spacing: { after: 50 },
  });
}

export async function generateDocx(
  data: DocxExportData,
  templateId: TemplateId = "classic",
  themeId?: string,
  fontPairId?: string,
  photoUrl?: string
): Promise<Blob> {
  const colors = getThemeColors(templateId, themeId);
  const fonts = getFontPair(fontPairId || "default");
  const template = TEMPLATES[templateId];
  const isTwoColumn = template?.layout === "two-column";

  const children: Paragraph[] = [];

  // Header
  if (templateId === "executive") {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.personal.fullName || "Your Name", bold: true, size: 48, color: "#ffffff", font: fonts.heading })],
        shading: { fill: colors.primary },
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.personal.title || "Professional Title", size: 24, color: colors.accent, font: fonts.heading })],
        shading: { fill: colors.primary },
        spacing: { after: 100 },
      }),
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.personal.fullName || "Your Name", bold: true, size: 40, color: colors.primary, font: fonts.heading })],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.personal.title || "Professional Title", italics: true, size: 24, color: colors.secondary, font: fonts.body })],
        spacing: { after: 100 },
      }),
    );
  }

  // Contact info
  const contactParts = [
    data.personal.phone,
    data.personal.email,
    data.personal.location,
    data.personal.linkedin,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join(" | "), size: 20, color: colors.secondary, font: fonts.body })],
        spacing: { after: 150 },
      }),
    );
  }

  // Profile
  if (data.profile) {
    children.push(
      createSectionTitle("Profile", colors),
      new Paragraph({
        children: [new TextRun({ text: data.profile, size: 22, font: fonts.body })],
        spacing: { after: 150 },
      }),
    );
  }

  // Competencies
  const comps = data.competency?.filter(Boolean) || [];
  if (comps.length > 0) {
    children.push(
      createSectionTitle("Key Competencies", colors),
      ...comps.map((c) => createBullet(c)),
      new Paragraph({ children: [new TextRun(" ")], spacing: { after: 100 } }),
    );
  }

  // Skills
  const skills = data.skill?.filter(Boolean) || [];
  if (skills.length > 0) {
    children.push(
      createSectionTitle("Skills", colors),
      ...skills.map((s) => createBullet(s)),
      new Paragraph({ children: [new TextRun(" ")], spacing: { after: 100 } }),
    );
  }

  // Experience
  const exps = data.experiences?.filter((e) => e.company || e.role) || [];
  if (exps.length > 0) {
    children.push(createSectionTitle("Career History", colors));
    for (const exp of exps) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company || "Company"} — ${exp.role || "Position"}`, bold: true, size: 24, font: fonts.heading }),
          ],
          spacing: { after: 50 },
        }),
      );
      if (exp.period) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: exp.period, italics: true, size: 20, color: colors.secondary, font: fonts.body })],
            spacing: { after: 50 },
          }),
        );
      }
      if (exp.details) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: exp.details, size: 22, font: fonts.body })],
            spacing: { after: 100 },
          }),
        );
      }
    }
    children.push(new Paragraph({ children: [new TextRun(" ")], spacing: { after: 100 } }));
  }

  // Education
  const edus = data.education?.filter((e) => e.institution || e.qualification) || [];
  if (edus.length > 0) {
    children.push(createSectionTitle("Education", colors));
    for (const edu of edus) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.institution || "Institution"} — ${edu.qualification || "Qualification"}`, bold: true, size: 24, font: fonts.heading }),
          ],
          spacing: { after: 50 },
        }),
      );
      if (edu.period) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: edu.period, italics: true, size: 20, color: colors.secondary, font: fonts.body })],
            spacing: { after: 100 },
          }),
        );
      }
    }
    children.push(new Paragraph({ children: [new TextRun(" ")], spacing: { after: 100 } }));
  }

  // Certificates
  const certs = data.certificate?.filter((c) => c.name) || [];
  if (certs.length > 0) {
    children.push(createSectionTitle("Certifications", colors));
    for (const cert of certs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: cert.name, bold: true, size: 22, font: fonts.heading }),
            ...(cert.date ? [new TextRun({ text: ` (${cert.date})`, size: 20, color: colors.secondary, font: fonts.body })] : []),
          ],
          spacing: { after: 50 },
        }),
      );
    }
    children.push(new Paragraph({ children: [new TextRun(" ")], spacing: { after: 100 } }));
  }

  // References
  const refs = data.reference?.filter((r) => r.name || r.company) || [];
  if (refs.length > 0) {
    children.push(createSectionTitle("References", colors));
    for (const ref of refs) {
      const parts = [ref.name, ref.company, ref.role].filter(Boolean);
      const contactParts = [ref.email, ref.phone].filter(Boolean);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: parts.join(" - "), bold: true, size: 22, font: fonts.heading }),
          ],
          spacing: { after: 50 },
        }),
      );
      if (contactParts.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: contactParts.join(" | "), size: 20, color: colors.secondary, font: fonts.body })],
            spacing: { after: 100 },
          }),
        );
      }
    }
  }

  // Additional Info
  const addInfos = data.additionalInfo?.filter(Boolean) || [];
  if (addInfos.length > 0) {
    children.push(createSectionTitle("Additional Information", colors));
    for (const info of addInfos) {
      children.push(createBullet(info));
    }
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}