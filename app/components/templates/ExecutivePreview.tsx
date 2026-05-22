import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

export function getExecutiveSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, experiences, education, certificate, skill, reference, additionalInfo, colors } = props;
  const sections: TemplateSection[] = [];

  sections.push({
    key: "header",
    canBreak: false,
    estimatedHeight: 140,
    content: (
      <div style={{ background: colors.primary, color: "#fff", margin: "-15mm -15mm 8mm -15mm", padding: "24px 15mm" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", margin: 0 }}>{personal.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "16px", color: colors.accent, fontFamily: "Georgia, serif", margin: "4px 0" }}>{personal.title || "Your Professional Title"}</p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontFamily: "Georgia, serif", margin: "8px 0 0 0" }}>
          {[personal.phone, personal.email, personal.location].filter(Boolean).join(" | ")}
        </p>
        {personal.linkedin && <p style={{ fontSize: "12px", color: colors.accent, margin: "4px 0 0 0" }}>{personal.linkedin}</p>}
      </div>
    ),
  });

  const sectionHeading = (title: string) => (
    <h2 style={{ fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "bold", color: colors.accent, textTransform: "uppercase", borderBottom: `1px solid ${colors.accent}`, paddingBottom: "4px", margin: "0 0 12px 0" }}>{title}</h2>
  );

  if (profile) {
    sections.push({ key: "profile", canBreak: true, estimatedHeight: Math.max(100, profile.length / 5 + 50),
      content: (<section className="mb-6">{sectionHeading("Professional Profile")}<p style={{ fontFamily: "Georgia, serif", fontSize: "12px", color: colors.text, lineHeight: "1.5", margin: 0 }}>{profile}</p></section>)
    });
  }

  const validExp = experiences.filter((e: any) => e.company || e.role);
  if (validExp.length > 0) {
    sections.push({ key: "experience", canBreak: true, estimatedHeight: Math.max(200, validExp.length * 180),
      content: (<section className="mb-6">{sectionHeading("Career History")}{validExp.map((exp: any) => (
        <div key={exp.id} className="mb-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: "14px", color: colors.primary, margin: 0 }}>{exp.company}</h3>
            <span style={{ fontSize: "12px", color: colors.secondary }}>{exp.period}</span>
          </div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", fontStyle: "italic", margin: "2px 0", color: colors.text }}>{exp.role}</p>
          {exp.details && <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", margin: "4px 0 0 0", lineHeight: "1.5", color: colors.text }}>{exp.details}</p>}
        </div>
      ))}</section>)
    });
  }

  const validEdu = education.filter((e: any) => e.institution || e.qualification);
  if (validEdu.length > 0) {
    sections.push({ key: "education", canBreak: true, estimatedHeight: Math.max(80, validEdu.length * 80),
      content: (<section className="mb-6">{sectionHeading("Education")}{validEdu.map((ed: any) => (
        <div key={ed.id} className="mb-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: "14px", color: colors.primary, margin: 0 }}>{ed.institution}</h3>
            <span style={{ fontSize: "12px", color: colors.secondary }}>{ed.period}</span>
          </div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", margin: "2px 0 0 0", color: colors.text }}>{ed.qualification}</p>
        </div>
      ))}</section>)
    });
  }

  const validCert = certificate.filter((c: any) => c.name || c.date);
  if (validCert.length > 0) {
    sections.push({ key: "certificate", canBreak: true, estimatedHeight: Math.max(50, validCert.length * 50),
      content: (<section className="mb-6">{sectionHeading("Certificates")}{validCert.map((cert: any) => (
        <p key={cert.id} style={{ fontFamily: "Georgia, serif", fontSize: "12px", margin: "0 0 4px 0", color: colors.text }}>{cert.name}{cert.date ? ` (${cert.date})` : ""}</p>
      ))}</section>)
    });
  }

  const validSkills = skill.filter((s: string) => s);
  if (validSkills.length > 0) {
    sections.push({ key: "skill", canBreak: true, estimatedHeight: Math.max(100, validSkills.length * 25 + 50),
      content: (<section className="mb-6">{sectionHeading("Skills")}<ul className="list-disc pl-5" style={{ fontFamily: "Georgia, serif", fontSize: "12px", color: colors.text, margin: 0 }}>{validSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></section>)
    });
  }

  const validRef = reference.filter((r: any) => r.name || r.company);
  if (validRef.length > 0) {
    sections.push({ key: "reference", canBreak: true, estimatedHeight: Math.max(80, validRef.length * 80),
      content: (<section className="mb-6">{sectionHeading("References")}{validRef.map((ref: any) => (
        <div key={ref.id} className="mb-3" style={{ fontFamily: "Georgia, serif", fontSize: "12px", color: colors.text }}>
          <p style={{ fontWeight: "bold", margin: 0 }}>{ref.name}</p>
          <p style={{ margin: "2px 0" }}>{ref.role}{ref.company ? `, ${ref.company}` : ""}</p>
        </div>
      ))}</section>)
    });
  }

  const validAI = additionalInfo.filter((a: string) => a);
  if (validAI.length > 0) {
    sections.push({ key: "additionalInfo", canBreak: true, estimatedHeight: Math.max(60, validAI.length * 30 + 50),
      content: (<section className="mb-6">{sectionHeading("Additional Information")}{validAI.map((info: string, i: number) => <p key={i} style={{ fontFamily: "Georgia, serif", fontSize: "12px", margin: "0 0 4px 0", lineHeight: "1.5", color: colors.text }}>{info}</p>)}</section>)
    });
  }

  return { main: sections };
}
