import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

export function getAcademicSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, experiences, education, certificate, skill, reference, additionalInfo, colors, photoUrl } = props;
  const sections: TemplateSection[] = [];

  sections.push({
    key: "header",
    canBreak: false,
    estimatedHeight: photoUrl ? 140 : 100,
    content: (
      <header style={{ paddingBottom: "16px", marginBottom: "32px", borderBottom: `3px solid ${colors.accent}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px" }}>
          {photoUrl && <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${colors.primary}` }}><img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "26px", fontWeight: "bold", color: colors.primary, fontFamily: "Georgia, serif", margin: 0 }}>{personal.fullName || "Your Name"}</h1>
            <p style={{ fontSize: "14px", color: colors.secondary, fontFamily: "Georgia, serif", margin: "4px 0 8px 0" }}>{personal.title || "Your Title"}</p>
            <p style={{ fontSize: "11px", color: colors.text, margin: 0 }}>
              {[personal.email, personal.phone, personal.location].filter(Boolean).join(" | ")}
            </p>
          </div>
        </div>
      </header>
    ),
  });

  const sectionHeading = (title: string) => (
    <h2 style={{ fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: colors.primary, margin: "0 0 12px 0" }}>{title}</h2>
  );

  if (profile) {
    sections.push({ key: "profile", canBreak: true, estimatedHeight: Math.max(100, profile.length / 5 + 50),
      content: (<section className="mb-6">{sectionHeading("Abstract")}<p style={{ fontFamily: "Georgia, serif", fontSize: "11px", color: colors.text, lineHeight: "1.6", margin: 0 }}>{profile}</p></section>)
    });
  }

  const validExp = experiences.filter((e: any) => e.company || e.role);
  if (validExp.length > 0) {
    sections.push({ key: "experience", canBreak: true, estimatedHeight: Math.max(200, validExp.length * 180),
      content: (<section className="mb-6">{sectionHeading("Experience")}{validExp.map((exp: any) => (
        <div key={exp.id} className="mb-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "14px", fontWeight: "600", color: colors.primary, margin: 0 }}>{exp.company}</h3>
            <span style={{ fontSize: "11px", fontStyle: "italic", color: colors.secondary }}>{exp.period}</span>
          </div>
          <h4 style={{ fontFamily: "Georgia, serif", fontSize: "12px", fontWeight: "500", color: colors.accent, margin: "2px 0 8px 0" }}>{exp.role}</h4>
          {exp.details && <p style={{ fontFamily: "Georgia, serif", fontSize: "11px", lineHeight: "1.6", margin: 0, color: colors.text }}>{exp.details}</p>}
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
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "14px", fontWeight: "600", color: colors.primary, margin: 0 }}>{ed.institution}</h3>
            <span style={{ fontSize: "11px", fontStyle: "italic", color: colors.secondary }}>{ed.period}</span>
          </div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", margin: "2px 0 0 0", color: colors.text }}>{ed.qualification}</p>
        </div>
      ))}</section>)
    });
  }

  const validCert = certificate.filter((c: any) => c.name || c.date);
  if (validCert.length > 0) {
    sections.push({ key: "certificate", canBreak: true, estimatedHeight: Math.max(50, validCert.length * 50),
      content: (<section className="mb-6">{sectionHeading("Certifications")}{validCert.map((cert: any) => (
        <p key={cert.id} style={{ fontFamily: "Georgia, serif", fontSize: "11px", margin: "0 0 4px 0", color: colors.text }}><strong>{cert.name}</strong>{cert.date ? <em>, {cert.date}</em> : ""}</p>
      ))}</section>)
    });
  }

  const validSkills = skill.filter((s: string) => s);
  if (validSkills.length > 0) {
    sections.push({ key: "skill", canBreak: true, estimatedHeight: Math.max(80, validSkills.length * 25 + 50),
      content: (<section className="mb-6">{sectionHeading("Skills & Expertise")}<ul className="list-disc pl-4" style={{ fontFamily: "Georgia, serif", fontSize: "11px", color: colors.text, margin: 0 }}>{validSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></section>)
    });
  }

  const validRef = reference.filter((r: any) => r.name || r.company);
  if (validRef.length > 0) {
    sections.push({ key: "reference", canBreak: false, estimatedHeight: 60,
      content: (<section className="mb-6">{sectionHeading("References")}<p style={{ fontFamily: "Georgia, serif", fontSize: "11px", fontStyle: "italic", color: colors.secondary, margin: 0 }}>Available upon request.</p></section>)
    });
  }

  const validAI = additionalInfo.filter((a: string) => a);
  if (validAI.length > 0) {
    sections.push({ key: "additionalInfo", canBreak: true, estimatedHeight: Math.max(60, validAI.length * 30 + 50),
      content: (<section className="mb-6">{sectionHeading("Additional Information")}{validAI.map((info: string, i: number) => <p key={i} style={{ fontFamily: "Georgia, serif", fontSize: "11px", margin: "0 0 4px 0", lineHeight: "1.6", color: colors.text }}>{info}</p>)}</section>)
    });
  }

  return { main: sections };
}
