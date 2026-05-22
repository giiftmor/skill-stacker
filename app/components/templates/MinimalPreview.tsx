import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

export function getMinimalSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, experiences, education, certificate, skill, reference, additionalInfo, colors } = props;
  const sections: TemplateSection[] = [];

  sections.push({
    key: "header",
    canBreak: false,
    estimatedHeight: 100,
    content: (
      <header style={{ textAlign: "center", paddingBottom: "24px", marginBottom: "32px", borderBottom: "1px solid #eee" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "300", color: colors.primary, letterSpacing: "3px", textTransform: "uppercase", margin: 0 }}>{personal.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "12px", color: colors.secondary, letterSpacing: "1px", margin: "8px 0 12px 0" }}>{personal.title || "Your Professional Title"}</p>
        <p style={{ fontSize: "11px", color: colors.text, margin: 0 }}>
          {[personal.phone, personal.email, personal.location].filter(Boolean).join(" | ")}
        </p>
        {personal.linkedin && <p style={{ fontSize: "11px", color: colors.text, margin: "4px 0 0 0" }}>{personal.linkedin}</p>}
      </header>
    ),
  });

  const sectionHeading = (title: string) => (
    <h2 style={{ fontSize: "11px", fontWeight: "400", textTransform: "uppercase", letterSpacing: "2px", color: colors.primary, borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "16px" }}>{title}</h2>
  );

  if (profile) {
    sections.push({ key: "profile", canBreak: true, estimatedHeight: Math.max(100, profile.length / 5 + 50),
      content: (<section className="mb-8">{sectionHeading("Profile")}<p style={{ fontSize: "11px", color: colors.text, lineHeight: "1.6", margin: 0 }}>{profile}</p></section>)
    });
  }

  const validExp = experiences.filter((e: any) => e.company || e.role);
  if (validExp.length > 0) {
    sections.push({ key: "experience", canBreak: true, estimatedHeight: Math.max(200, validExp.length * 180),
      content: (<section className="mb-8">{sectionHeading("Experience")}{validExp.map((exp: any) => (
        <div key={exp.id} className="mb-6">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "500", color: colors.primary, margin: 0 }}>{exp.company}</h3>
            <span style={{ fontSize: "11px", color: colors.secondary }}>{exp.period}</span>
          </div>
          <p style={{ fontSize: "11px", margin: "0 0 8px 0", color: colors.text }}>{exp.role}</p>
          {exp.details && <p style={{ fontSize: "11px", lineHeight: "1.6", margin: 0, color: colors.text }}>{exp.details}</p>}
        </div>
      ))}</section>)
    });
  }

  const validEdu = education.filter((e: any) => e.institution || e.qualification);
  if (validEdu.length > 0) {
    sections.push({ key: "education", canBreak: true, estimatedHeight: Math.max(80, validEdu.length * 80),
      content: (<section className="mb-8">{sectionHeading("Education")}{validEdu.map((ed: any) => (
        <div key={ed.id} className="mb-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "500", color: colors.primary, margin: 0 }}>{ed.institution}</h3>
            <span style={{ fontSize: "11px", color: colors.secondary }}>{ed.period}</span>
          </div>
          <p style={{ fontSize: "11px", margin: "2px 0 0 0", color: colors.text }}>{ed.qualification}</p>
        </div>
      ))}</section>)
    });
  }

  const validSkills = skill.filter((s: string) => s);
  if (validSkills.length > 0) {
    sections.push({ key: "skill", canBreak: true, estimatedHeight: Math.max(80, Math.ceil(validSkills.length / 3) * 30 + 50),
      content: (<section className="mb-8">{sectionHeading("Skills")}<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{validSkills.map((s: string, i: number) => (
        <span key={i} style={{ fontSize: "11px", padding: "4px 12px", background: "#f5f5f5", color: colors.text }}>{s}</span>
      ))}</div></section>)
    });
  }

  const validRef = reference.filter((r: any) => r.name || r.company);
  if (validRef.length > 0) {
    sections.push({ key: "reference", canBreak: true, estimatedHeight: Math.max(80, validRef.length * 80),
      content: (<section className="mb-8">{sectionHeading("References")}{validRef.map((ref: any) => (
        <div key={ref.id} className="mb-3" style={{ fontSize: "11px", color: colors.text }}>
          <p style={{ fontWeight: "500", margin: 0 }}>{ref.name}</p>
          {ref.role && <p style={{ margin: "2px 0" }}>{ref.role}</p>}
          {ref.company && <p style={{ margin: 0, color: colors.secondary }}>{ref.company}</p>}
        </div>
      ))}</section>)
    });
  }

  return { main: sections };
}
