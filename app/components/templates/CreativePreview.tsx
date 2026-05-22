import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

export function getCreativeSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo, colors } = props;
  const sections: TemplateSection[] = [];

  sections.push({
    key: "header",
    canBreak: false,
    estimatedHeight: 120,
    content: (
      <header style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: colors.primary, fontFamily: "Verdana, sans-serif", margin: 0 }}>{personal.fullName || "Your Name"}</h1>
        <div style={{ width: "64px", height: "4px", background: colors.accent, margin: "12px auto" }} />
        <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: colors.accent, fontFamily: "Verdana, sans-serif", margin: 0 }}>{personal.title || "Your Title"}</p>
        <p style={{ fontSize: "11px", color: colors.text, margin: "12px 0 0 0" }}>
          {[personal.phone, personal.email, personal.location].filter(Boolean).join(" | ")}
        </p>
        {personal.linkedin && <p style={{ fontSize: "11px", color: colors.accent, margin: "4px 0 0 0" }}>{personal.linkedin}</p>}
      </header>
    ),
  });

  const blockHeading = (title: string) => (
    <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#fff", background: colors.primary, padding: "8px 16px", margin: "0 0 16px 0" }}>{title}</h2>
  );

  if (profile) {
    sections.push({ key: "profile", canBreak: true, estimatedHeight: Math.max(100, profile.length / 5 + 60),
      content: (<section className="mb-6">{blockHeading("Profile")}<p style={{ fontSize: "12px", color: colors.text, lineHeight: "1.5", margin: 0 }}>{profile}</p></section>)
    });
  }

  const validComp = competency.filter((c: string) => c);
  if (validComp.length > 0) {
    sections.push({ key: "competency", canBreak: true, estimatedHeight: Math.max(100, Math.ceil(validComp.length / 2) * 40 + 60),
      content: (<section className="mb-6">{blockHeading("Core Competencies")}<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>{validComp.map((c: string, i: number) => (
        <div key={i} style={{ fontSize: "12px", padding: "8px 12px", borderLeft: `4px solid ${i % 2 === 0 ? colors.primary : colors.accent}`, color: colors.text, background: "#fafafa" }}>{c}</div>
      ))}</div></section>)
    });
  }

  const validExp = experiences.filter((e: any) => e.company || e.role);
  if (validExp.length > 0) {
    sections.push({ key: "experience", canBreak: true, estimatedHeight: Math.max(200, validExp.length * 180),
      content: (<section className="mb-6">{blockHeading("Experience")}{validExp.map((exp: any, idx: number) => (
        <div key={exp.id} className="mb-4" style={{ paddingLeft: "16px", borderLeft: `2px solid ${idx % 2 === 0 ? colors.primary : colors.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", color: colors.primary, margin: 0 }}>{exp.company}</h3>
            <span style={{ fontSize: "11px", color: colors.secondary }}>{exp.period}</span>
          </div>
          <p style={{ fontSize: "11px", fontWeight: "500", color: colors.accent, margin: "2px 0 8px 0" }}>{exp.role}</p>
          {exp.details && <p style={{ fontSize: "11px", lineHeight: "1.5", margin: 0, color: colors.text }}>{exp.details}</p>}
        </div>
      ))}</section>)
    });
  }

  const validEdu = education.filter((e: any) => e.institution || e.qualification);
  if (validEdu.length > 0) {
    sections.push({ key: "education", canBreak: true, estimatedHeight: Math.max(80, validEdu.length * 80),
      content: (<section className="mb-6">{blockHeading("Education")}{validEdu.map((ed: any) => (
        <div key={ed.id} className="mb-3" style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.primary, marginTop: "6px", flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: colors.primary, margin: 0 }}>{ed.institution}</h3>
            <p style={{ fontSize: "11px", color: colors.text, margin: "2px 0" }}>{ed.qualification}</p>
            <span style={{ fontSize: "11px", color: colors.secondary }}>{ed.period}</span>
          </div>
        </div>
      ))}</section>)
    });
  }

  const validSkills = skill.filter((s: string) => s);
  if (validSkills.length > 0) {
    sections.push({ key: "skill", canBreak: true, estimatedHeight: Math.max(80, Math.ceil(validSkills.length / 4) * 35 + 50),
      content: (<section className="mb-6">{blockHeading("Skills")}<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{validSkills.map((s: string, i: number) => (
        <span key={i} style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "999px", color: "#fff", fontWeight: "500", background: i % 2 === 0 ? colors.primary : colors.accent }}>{s}</span>
      ))}</div></section>)
    });
  }

  return { main: sections };
}
