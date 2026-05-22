import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

export function getTwoColumnSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo, colors, photoUrl } = props;
  const sidebar: TemplateSection[] = [];
  const main: TemplateSection[] = [];

  sidebar.push({
    key: "sidebar-header",
    canBreak: false,
    estimatedHeight: photoUrl ? 280 : 200,
    content: (
      <div style={{ background: colors.primary, color: "#fff", padding: "16px" }}>
        {photoUrl && <div style={{ width: "96px", height: "96px", borderRadius: "50%", margin: "0 auto 12px", overflow: "hidden", border: "2px solid #fff" }}><img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <h1 style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center", margin: "0 0 4px 0" }}>{personal.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "12px", textAlign: "center", color: colors.accent, margin: 0 }}>{personal.title || "Your Title"}</p>
        <div style={{ fontSize: "11px", marginTop: "16px" }}>
          {personal.phone && <p style={{ margin: "2px 0" }}>{personal.phone}</p>}
          {personal.email && <p style={{ margin: "2px 0" }}>{personal.email}</p>}
          {personal.location && <p style={{ margin: "2px 0" }}>{personal.location}</p>}
          {personal.linkedin && <p style={{ margin: "2px 0", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis" }}>{personal.linkedin}</p>}
        </div>
      </div>
    ),
  });

  const validSkills = skill.filter((s: string) => s);
  if (validSkills.length > 0) {
    sidebar.push({ key: "sidebar-skills", canBreak: true, estimatedHeight: Math.max(80, validSkills.length * 25 + 40),
      content: (<div style={{ background: colors.secondary, padding: "16px" }}><h2 style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#fff", margin: "0 0 8px 0" }}>Skills</h2><ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{validSkills.map((s: string, i: number) => <li key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", padding: "2px 0" }}>{s}</li>)}</ul></div>)
    });
  }

  const validComp = competency.filter((c: string) => c);
  if (validComp.length > 0) {
    sidebar.push({ key: "sidebar-competency", canBreak: true, estimatedHeight: Math.max(80, validComp.length * 25 + 40),
      content: (<div style={{ background: colors.secondary, padding: "16px" }}><h2 style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#fff", margin: "0 0 8px 0" }}>Competencies</h2><ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{validComp.map((c: string, i: number) => <li key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", padding: "2px 0" }}>{c}</li>)}</ul></div>)
    });
  }

  const mainSectionHeading = (title: string) => (
    <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", color: colors.primary, borderBottom: `2px solid ${colors.accent}`, paddingBottom: "4px", margin: "0 0 12px 0" }}>{title}</h2>
  );

  if (profile) {
    main.push({ key: "profile", canBreak: true, estimatedHeight: Math.max(100, profile.length / 5 + 50),
      content: (<section className="mb-6">{mainSectionHeading("Profile")}<p style={{ fontSize: "12px", color: colors.text, lineHeight: "1.5", margin: 0 }}>{profile}</p></section>)
    });
  }

  const validExp = experiences.filter((e: any) => e.company || e.role);
  if (validExp.length > 0) {
    main.push({ key: "experience", canBreak: true, estimatedHeight: Math.max(200, validExp.length * 180),
      content: (<section className="mb-6">{mainSectionHeading("Experience")}{validExp.map((exp: any) => (
        <div key={exp.id} className="mb-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", color: colors.primary, margin: 0 }}>{exp.company}</h3>
            <span style={{ fontSize: "11px", color: colors.secondary }}>{exp.period}</span>
          </div>
          <p style={{ fontSize: "12px", fontStyle: "italic", margin: "2px 0", color: colors.text }}>{exp.role}</p>
          {exp.details && <p style={{ fontSize: "11px", lineHeight: "1.5", margin: "4px 0 0 0", color: colors.text }}>{exp.details}</p>}
        </div>
      ))}</section>)
    });
  }

  const validEdu = education.filter((e: any) => e.institution || e.qualification);
  if (validEdu.length > 0) {
    main.push({ key: "education", canBreak: true, estimatedHeight: Math.max(80, validEdu.length * 80),
      content: (<section className="mb-6">{mainSectionHeading("Education")}{validEdu.map((ed: any) => (
        <div key={ed.id} className="mb-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", color: colors.primary, margin: 0 }}>{ed.institution}</h3>
            <span style={{ fontSize: "11px", color: colors.secondary }}>{ed.period}</span>
          </div>
          <p style={{ fontSize: "12px", margin: "2px 0 0 0", color: colors.text }}>{ed.qualification}</p>
        </div>
      ))}</section>)
    });
  }

  const validCert = certificate.filter((c: any) => c.name || c.date);
  if (validCert.length > 0) {
    main.push({ key: "certificate", canBreak: true, estimatedHeight: Math.max(50, validCert.length * 50),
      content: (<section className="mb-6">{mainSectionHeading("Certificates")}{validCert.map((cert: any) => (
        <p key={cert.id} style={{ fontSize: "12px", margin: "0 0 4px 0", color: colors.text }}><strong>{cert.name}</strong>{cert.date ? ` (${cert.date})` : ""}</p>
      ))}</section>)
    });
  }

  const validRef = reference.filter((r: any) => r.name || r.company);
  if (validRef.length > 0) {
    main.push({ key: "reference", canBreak: true, estimatedHeight: Math.max(80, validRef.length * 80),
      content: (<section className="mb-6">{mainSectionHeading("References")}{validRef.map((ref: any) => (
        <div key={ref.id} className="mb-3" style={{ fontSize: "12px", color: colors.text }}>
          <p style={{ fontWeight: "bold", margin: 0 }}>{ref.name}</p>
          {(ref.role || ref.company) && <p style={{ margin: "2px 0" }}>{ref.role}{ref.company ? `, ${ref.company}` : ""}</p>}
        </div>
      ))}</section>)
    });
  }

  return { sidebar, main };
}
