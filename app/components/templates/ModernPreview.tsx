import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

export function getModernSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, competency, experiences, education, skill, additionalInfo, colors } = props;
  const sections: TemplateSection[] = [];

  sections.push({
    key: "header",
    canBreak: false,
    estimatedHeight: 120,
    content: (
      <div style={{ background: colors.primary, color: "#fff", margin: "-15mm -15mm 8mm -15mm", padding: "20px 15mm" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "bold", fontFamily: "Helvetica, sans-serif", margin: 0 }}>{personal.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "14px", color: colors.accent, fontFamily: "Helvetica, sans-serif", margin: "4px 0" }}>{personal.title || "Your Title"}</p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: "8px 0 0 0" }}>
          {[personal.phone, personal.email, personal.location].filter(Boolean).join(" | ")}
        </p>
      </div>
    ),
  });

  const blockHeading = (title: string) => (
    <h2 style={{ fontFamily: "Helvetica, sans-serif", fontSize: "14px", fontWeight: "bold", color: "#fff", background: colors.accent, padding: "6px 12px", margin: "0 0 12px 0", display: "inline-block" }}>{title}</h2>
  );

  if (profile) {
    sections.push({ key: "profile", canBreak: true, estimatedHeight: Math.max(100, profile.length / 5 + 60),
      content: (<section className="mb-6">{blockHeading("Professional Profile")}<p style={{ fontFamily: "Helvetica, sans-serif", fontSize: "12px", color: colors.text, lineHeight: "1.5", margin: 0 }}>{profile}</p></section>)
    });
  }

  const validComp = competency.filter((c: string) => c);
  if (validComp.length > 0) {
    sections.push({ key: "competency", canBreak: true, estimatedHeight: Math.max(100, validComp.length * 30 + 60),
      content: (<section className="mb-6">{blockHeading("Core Competencies")}<ul className="list-disc pl-5" style={{ fontFamily: "Helvetica, sans-serif", fontSize: "12px", color: colors.text, margin: 0 }}>{validComp.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul></section>)
    });
  }

  const validExp = experiences.filter((e: any) => e.company || e.role);
  if (validExp.length > 0) {
    sections.push({ key: "experience", canBreak: true, estimatedHeight: Math.max(200, validExp.length * 180),
      content: (<section className="mb-6">{blockHeading("Career History")}{validExp.map((exp: any) => (
        <div key={exp.id} className="mb-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontWeight: "bold", fontSize: "14px", color: colors.primary, margin: 0 }}>{exp.company}</h3>
            <span style={{ fontSize: "12px", color: colors.secondary }}>{exp.period}</span>
          </div>
          <p style={{ fontSize: "12px", fontStyle: "italic", margin: "2px 0", color: colors.text }}>{exp.role}</p>
          {exp.details && <p style={{ fontSize: "12px", margin: "4px 0 0 0", lineHeight: "1.5", color: colors.text }}>{exp.details}</p>}
        </div>
      ))}</section>)
    });
  }

  const validEdu = education.filter((e: any) => e.institution || e.qualification);
  if (validEdu.length > 0) {
    sections.push({ key: "education", canBreak: true, estimatedHeight: Math.max(80, validEdu.length * 80),
      content: (<section className="mb-6">{blockHeading("Education")}{validEdu.map((ed: any) => (
        <div key={ed.id} className="mb-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontWeight: "bold", fontSize: "14px", color: colors.primary, margin: 0 }}>{ed.institution}</h3>
            <span style={{ fontSize: "12px", color: colors.secondary }}>{ed.period}</span>
          </div>
          <p style={{ fontSize: "12px", margin: "2px 0 0 0", color: colors.text }}>{ed.qualification}</p>
        </div>
      ))}</section>)
    });
  }

  const validSkills = skill.filter((s: string) => s);
  if (validSkills.length > 0) {
    sections.push({ key: "skill", canBreak: true, estimatedHeight: Math.max(100, validSkills.length * 30 + 60),
      content: (<section className="mb-6">{blockHeading("Skills")}<ul className="list-disc pl-5" style={{ fontFamily: "Helvetica, sans-serif", fontSize: "12px", color: colors.text, margin: 0 }}>{validSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></section>)
    });
  }

  const validAI = additionalInfo.filter((a: string) => a);
  if (validAI.length > 0) {
    sections.push({ key: "additionalInfo", canBreak: true, estimatedHeight: Math.max(60, validAI.length * 30 + 50),
      content: (<section className="mb-6">{blockHeading("Additional Info")}{validAI.map((info: string, i: number) => <p key={i} style={{ fontSize: "12px", margin: "0 0 4px 0", lineHeight: "1.5", color: colors.text }}>{info}</p>)}</section>)
    });
  }

  return { main: sections };
}
