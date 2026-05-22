import type { TemplatePreviewProps, TemplateSection, TemplateSectionsResult } from "./index";

const EH = { header: 80, profile: 100, competencyList: 100, experienceEntry: 180, educationEntry: 80, certificateEntry: 50, skillList: 100, referenceEntry: 80, additionalInfo: 60 };

export function getClassicSections(props: TemplatePreviewProps): TemplateSectionsResult {
  const { personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo, colors, fontPair } = props;

  const sections: TemplateSection[] = [];

  sections.push({
    key: "header",
    canBreak: false,
    estimatedHeight: EH.header,
    content: (
      <div className="mb-6">
        <h1
          style={{
            fontFamily: fontPair.heading,
            color: colors.primary,
            fontSize: "28px",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          {personal.fullName}
        </h1>
        {personal.title && (
          <p
            style={{
              fontFamily: fontPair.heading,
              color: colors.secondary,
              fontSize: "16px",
              margin: "4px 0",
            }}
          >
            {personal.title}
          </p>
        )}
        <p
          style={{
            fontFamily: fontPair.body,
            color: colors.text,
            fontSize: "12px",
            margin: "4px 0",
          }}
        >
          {[personal.phone, personal.email, personal.location].filter(Boolean).join(" | ")}
        </p>
        {personal.linkedin && (
          <p
            style={{
              fontFamily: fontPair.body,
              color: colors.text,
              fontSize: "12px",
              margin: 0,
            }}
          >
            {personal.linkedin}
          </p>
        )}
      </div>
    ),
  });

  if (profile) {
    sections.push({
      key: "profile",
      canBreak: true,
      estimatedHeight: Math.max(EH.profile, 0),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Professional Profile
          </h2>
          <p
            style={{
              fontFamily: fontPair.body,
              color: colors.text,
              fontSize: "13px",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {profile}
          </p>
        </div>
      ),
    });
  }

  if (competency.some((c) => c)) {
    sections.push({
      key: "competency",
      canBreak: true,
      estimatedHeight: Math.max(EH.competencyList, competency.filter((c) => c).length * 20),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Core Competencies
          </h2>
          <ul className="list-disc pl-5 space-y-1" style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px", margin: 0 }}>
            {competency.filter((c) => c).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  const validExperiences = experiences.filter((e) => e.company || e.role);
  if (validExperiences.length > 0) {
    sections.push({
      key: "experience",
      canBreak: true,
      estimatedHeight: Math.max(EH.experienceEntry * validExperiences.length, EH.experienceEntry),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Career History
          </h2>
          <div style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px" }}>
            {validExperiences.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold" }}>{exp.company}</span>
                  <span style={{ fontSize: "12px", color: colors.secondary }}>{exp.period}</span>
                </div>
                <p style={{ fontStyle: "italic", margin: "2px 0" }}>{exp.role}</p>
                {exp.details && (
                  <p style={{ margin: "4px 0 0 0", lineHeight: "1.5" }}>{exp.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (education.length > 0) {
    sections.push({
      key: "education",
      canBreak: true,
      estimatedHeight: Math.max(EH.educationEntry * education.length, EH.educationEntry),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Education & Qualifications
          </h2>
          <div style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px" }}>
            {education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold" }}>{edu.institution}</span>
                  <span style={{ fontSize: "12px", color: colors.secondary }}>{edu.period}</span>
                </div>
                <p style={{ margin: "2px 0 0 0" }}>{edu.qualification}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (certificate.length > 0) {
    sections.push({
      key: "certificate",
      canBreak: true,
      estimatedHeight: Math.max(EH.certificateEntry * certificate.length, EH.certificateEntry),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Certificates
          </h2>
          <div style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px" }}>
            {certificate.map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span>{cert.name}</span>
                {cert.date && <span style={{ fontSize: "12px", color: colors.secondary }}>{cert.date}</span>}
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (skill.some((s) => s)) {
    sections.push({
      key: "skill",
      canBreak: true,
      estimatedHeight: Math.max(EH.skillList, skill.filter((s) => s).length * 20),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Technical Skills
          </h2>
          <ul className="list-disc pl-5 space-y-1" style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px", margin: 0 }}>
            {skill.filter((s) => s).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  if (reference.length > 0) {
    sections.push({
      key: "reference",
      canBreak: true,
      estimatedHeight: Math.max(EH.referenceEntry * reference.length, EH.referenceEntry),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            References
          </h2>
          <div style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px" }}>
            {reference.map((ref) => (
              <div key={ref.id} className="mb-3">
                <p style={{ fontWeight: "bold", margin: 0 }}>{ref.name}</p>
                <p style={{ margin: "2px 0" }}>{ref.role}{ref.company ? `, ${ref.company}` : ""}</p>
                <p style={{ margin: 0, fontSize: "12px" }}>{ref.email}{ref.phone ? ` | ${ref.phone}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (additionalInfo.some((a) => a)) {
    sections.push({
      key: "additionalInfo",
      canBreak: true,
      estimatedHeight: Math.max(EH.additionalInfo, additionalInfo.filter((a) => a).length * 20),
      content: (
        <div className="mb-6">
          <h2
            style={{
              fontFamily: fontPair.heading,
              color: colors.primary,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "4px",
            }}
          >
            Additional Information
          </h2>
          <div style={{ fontFamily: fontPair.body, color: colors.text, fontSize: "13px" }}>
            {additionalInfo.filter((a) => a).map((info, i) => (
              <p key={i} style={{ margin: "0 0 4px 0", lineHeight: "1.5" }}>
                {info}
              </p>
            ))}
          </div>
        </div>
      ),
    });
  }

  return { main: sections };
}
