// app/lib/export/pdfExport.ts - Template-aware PDF export
import { Document, Page, Text, View, StyleSheet, Font, PDFDownloadLink } from "@react-pdf/renderer";
import { TEMPLATES, THEMES, FONT_PAIRS, TemplateId } from "../templates/templateDefinitions";

Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", fontWeight: 300 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf", fontWeight: 500 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/Roboto-Light.ttf", fontWeight: 300 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/Roboto-Medium.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/Roboto-Bold.ttf", fontWeight: 700 },
  ],
});

export interface PDFExportData {
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

function getFontFamily(fontPairId: string): string {
  const pair = FONT_PAIRS.find((p) => p.id === fontPairId);
  return pair?.heading || "Roboto";
}

interface CVDocumentProps {
  data: PDFExportData;
  templateId: TemplateId;
  themeId?: string;
  fontPairId?: string;
  photoUrl?: string;
}

export const CVDocument = ({ data, templateId, themeId, fontPairId, photoUrl }: CVDocumentProps) => {
  const colors = getThemeColors(templateId, themeId);
  const fontFamily = getFontFamily(fontPairId || "default");
  const template = TEMPLATES[templateId];
  const isTwoColumn = template?.layout === "two-column";
  const hasPhoto = template?.supportsPhoto && photoUrl;

  const skills = data.skill?.filter(Boolean) || [];
  const comps = data.competency?.filter(Boolean) || [];

  const baseStyles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily, backgroundColor: colors.background },
    header: { marginBottom: 20, paddingBottom: 10 },
    headerWithPhoto: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
    photo: { width: 80, height: 80, objectFit: "cover", borderRadius: 40 },
    headerText: { flex: 1 },
    name: { fontSize: 32, fontWeight: "bold", color: colors.primary, marginBottom: 4 },
    nameWithPhoto: { fontSize: 28, fontWeight: "bold", color: colors.primary, marginBottom: 4 },
    title: { textTransform: "uppercase", fontSize: 12, color: colors.secondary, marginBottom: 6 },
    contactInfo: { fontSize: 9, color: colors.secondary, marginTop: 4 },
    section: { marginTop: 15, marginBottom: 10 },
    sectionTitle: { textTransform: "uppercase", fontSize: 13, fontWeight: "bold", color: colors.primary, marginBottom: 8, paddingBottom: 4 },
    text: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: colors.text },
    bulletPoint: { fontSize: 10, marginLeft: 15, marginBottom: 3, color: colors.text },
    experienceItem: { marginBottom: 12 },
    experienceHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
    companyName: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase", color: colors.primary },
    companyRole: { fontSize: 11, color: colors.secondary, marginBottom: 3 },
    period: { fontSize: 9, color: colors.secondary },
    details: { fontSize: 10, lineHeight: 1.4, color: colors.text, marginTop: 4 },
    twoColumnContainer: { flexDirection: "row", gap: 20 },
    sidebar: { width: 180, backgroundColor: colors.primary, padding: 15, borderRadius: 4 },
    mainContent: { flex: 1 },
    sidebarText: { color: "#ffffff", fontSize: 10, lineHeight: 1.5 },
    sidebarSectionTitle: { color: colors.accent, fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginBottom: 8, borderBottom: `1px solid ${colors.accent}`, paddingBottom: 4 },
    executiveHeader: { backgroundColor: colors.primary, padding: 24, marginBottom: 20 },
    executiveName: { fontSize: 28, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
    executiveTitle: { fontSize: 14, color: colors.accent },
    executiveContact: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 8 },
  });

  const renderHeader = () => {
    if (templateId === "executive") {
      return (
        <View style={baseStyles.executiveHeader}>
          <Text style={baseStyles.executiveName}>{data.personal.fullName || "Your Name"}</Text>
          <Text style={baseStyles.executiveTitle}>{data.personal.title || "Professional Title"}</Text>
          <Text style={baseStyles.executiveContact}>
            {[data.personal.phone, data.personal.email, data.personal.location].filter(Boolean).join(" | ")}
          </Text>
        </View>
      );
    }

    const contactText = [data.personal.phone, data.personal.email, data.personal.location, data.personal.linkedin].filter(Boolean).join(" | ");

    if (hasPhoto || isTwoColumn) {
      return (
        <View style={[baseStyles.header, baseStyles.headerWithPhoto]}>
          {hasPhoto && <View style={baseStyles.photo}><Text style={{ color: "#fff", fontSize: 8 }}>Photo</Text></View>}
          <View style={baseStyles.headerText}>
            <Text style={baseStyles.nameWithPhoto}>{data.personal.fullName || "Your Name"}</Text>
            <Text style={baseStyles.title}>{data.personal.title || "Professional Title"}</Text>
            <Text style={baseStyles.contactInfo}>{contactText}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[baseStyles.header, { borderBottom: `2px solid ${colors.accent}` }]}>
        <Text style={baseStyles.name}>{data.personal.fullName || "Your Name"}</Text>
        <Text style={baseStyles.title}>{data.personal.title || "Professional Title"}</Text>
        <Text style={baseStyles.contactInfo}>{contactText}</Text>
      </View>
    );
  };

  const renderSectionTitle = (title: string) => (
    <Text style={[baseStyles.sectionTitle, { borderBottom: `1px solid ${colors.accent}` }]}>{title}</Text>
  );

  const renderProfile = () => {
    if (!data.profile) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("Profile")}
        <Text style={baseStyles.text}>{data.profile}</Text>
      </View>
    );
  };

  const renderCompetencies = () => {
    const comps = data.competency?.filter(Boolean) || [];
    if (comps.length === 0) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("Key Competencies")}
        {comps.map((comp, idx) => (
          <Text key={idx} style={baseStyles.bulletPoint}>• {comp}</Text>
        ))}
      </View>
    );
  };

  const renderSkills = () => {
    const skills = data.skill?.filter(Boolean) || [];
    if (skills.length === 0) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("Skills")}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {skills.map((skill, idx) => (
            <Text key={idx} style={[baseStyles.text, { backgroundColor: `${colors.primary}15`, padding: "4 8", borderRadius: 4 }]}>
              {skill}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderExperiences = () => {
    const exps = data.experiences?.filter((e) => e.company || e.role) || [];
    if (exps.length === 0) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("Career History")}
        {exps.map((exp, idx) => (
          <View key={idx} style={baseStyles.experienceItem}>
            <View style={baseStyles.experienceHeader}>
              <Text style={baseStyles.companyName}>{exp.company || "Company"}</Text>
              <Text style={baseStyles.period}>{exp.period}</Text>
            </View>
            <Text style={baseStyles.companyRole}>{exp.role || "Position"}</Text>
            {exp.details && <Text style={baseStyles.details}>{exp.details}</Text>}
          </View>
        ))}
      </View>
    );
  };

  const renderEducation = () => {
    const edus = data.education?.filter((e) => e.institution || e.qualification) || [];
    if (edus.length === 0) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("Education")}
        {edus.map((edu, idx) => (
          <View key={idx} style={baseStyles.experienceItem}>
            <View style={baseStyles.experienceHeader}>
              <Text style={baseStyles.companyRole}>{edu.institution || "Institution"} — {edu.qualification || "Qualification"}</Text>
              <Text style={baseStyles.period}>{edu.period}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCertificates = () => {
    const certs = data.certificate?.filter((c) => c.name) || [];
    if (certs.length === 0) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("Certifications")}
        {certs.map((cert, idx) => (
          <View key={idx} style={{ ...baseStyles.experienceItem, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={baseStyles.text}>{cert.name}</Text>
            {cert.date && <Text style={baseStyles.period}>{cert.date}</Text>}
          </View>
        ))}
      </View>
    );
  };

  const renderReferences = () => {
    const refs = data.reference?.filter((r) => r.name || r.company) || [];
    if (refs.length === 0) return null;
    return (
      <View style={baseStyles.section}>
        {renderSectionTitle("References")}
        {refs.map((ref, idx) => (
          <Text key={idx} style={baseStyles.text}>
            {ref.name || "Name"}{ref.company ? ` - ${ref.company}` : ""}{ref.role ? `, ${ref.role}` : ""}
            {' '}[{ref.email || "email"} | {ref.phone || "phone"}]
          </Text>
        ))}
      </View>
    );
  };

  if (isTwoColumn) {
    return (
      <Document>
        <Page size="A4" style={baseStyles.page}>
          <View style={baseStyles.twoColumnContainer}>
            <View style={baseStyles.sidebar}>
              <Text style={{ ...baseStyles.name, color: "#fff", marginBottom: 10 }}>{data.personal.fullName || "Name"}</Text>
              <Text style={{ ...baseStyles.title, color: colors.accent }}>{data.personal.title || "Title"}</Text>
              <Text style={{ ...baseStyles.contactInfo, color: "rgba(255,255,255,0.8)", marginBottom: 15 }}>{data.personal.phone}{data.personal.email ? ` | ${data.personal.email}` : ""}</Text>
              
              {comps.length > 0 && (
                <>
                  <Text style={baseStyles.sidebarSectionTitle}>Skills</Text>
                  {skills.map((s, i) => <Text key={i} style={baseStyles.sidebarText}>• {s}</Text>)}
                </>
              )}
            </View>
            <View style={baseStyles.mainContent}>
              {renderProfile()}
              {renderExperiences()}
              {renderEducation()}
              {renderCertificates()}
              {renderReferences()}
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {renderHeader()}
        {renderProfile()}
        {(comps.length > 0 || skills.length > 0) && (
          <View style={baseStyles.twoColumnContainer}>
            <View style={{ flex: 1 }}>
              {renderCompetencies()}
            </View>
            <View style={{ flex: 1 }}>
              {renderSkills()}
            </View>
          </View>
        )}
        {renderExperiences()}
        {renderEducation()}
        {renderCertificates()}
        {renderReferences()}
        {data.additionalInfo?.filter(Boolean).length > 0 && (
          <View style={baseStyles.section}>
            {renderSectionTitle("Additional Information")}
            {data.additionalInfo.filter(Boolean).map((info, idx) => (
              <Text key={idx} style={baseStyles.text}>• {info}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export async function generatePDF(
  data: PDFExportData,
  templateId: TemplateId = "classic",
  themeId?: string,
  fontPairId?: string,
  photoUrl?: string
) {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<CVDocument data={data} templateId={templateId} themeId={themeId} fontPairId={fontPairId} photoUrl={photoUrl} />).toBlob();
}

export function createPDFLink(
  data: PDFExportData,
  templateId: TemplateId = "classic",
  themeId?: string,
  fontPairId?: string,
  photoUrl?: string
) {
  return PDFDownloadLink;
}