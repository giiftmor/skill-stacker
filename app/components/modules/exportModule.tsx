"use client";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";

import type { ExportFunctionProps } from "../../types/global";

Font.register({
  family: "Mulish",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/mulish/v1/6XLGOuZN2ST0lHO3VzlKDN4.woff2",
    },
    {
      src: "https://fonts.gstatic.com/s/mulish/v1/6XLGOuZN2ST0lHO3VzlKDZ4.woff2",
    },
  ],
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Mulish",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #333",
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  title: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottom: "1 solid #ddd",
    paddingBottom: 3,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 5,
  },
  bulletPoint: {
    fontSize: 11,
    marginLeft: 15,
    marginBottom: 3,
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  companyRole: {
    fontSize: 12,
    fontWeight: "bold",
  },
  period: {
    fontSize: 10,
    color: "#666",
  },
  details: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#444",
  },
});

// PDF Document Component
const CVDocument = ({
  personal,
  profile,
  skills,
  experiences,
  education,
  references,
}: Omit<ExportFunctionProps, "previewRef">) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{personal.fullName || "Your Name"}</Text>
        <Text style={styles.title}>
          {personal.title || "Your Professional Title"}
        </Text>
        <Text style={styles.contactInfo}>
          {[personal.phone, personal.email, personal.location]
            .filter(Boolean)
            .join(" | ")}
        </Text>
      </View>

      {/* Profile Section */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.text}>{profile}</Text>
        </View>
      )}

      {/* Skills Section */}
      {skills.filter(Boolean).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Skills</Text>
          {skills.filter(Boolean).map((skill, idx) => (
            <Text key={idx} style={styles.bulletPoint}>
              • {skill}
            </Text>
          ))}
        </View>
      )}

      {/* Experience Section */}
      {experiences.some((exp) => exp.company || exp.role) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career History</Text>
          {experiences
            .filter((exp) => exp.company || exp.role)
            .map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.companyRole}>
                    {exp.company || "Company"} — {exp.role || "Position"}
                  </Text>
                  <Text style={styles.period}>{exp.period}</Text>
                </View>
                {exp.details && (
                  <Text style={styles.details}>{exp.details}</Text>
                )}
              </View>
            ))}
        </View>
      )}

      {/* Education Section */}
      {education.some((ed) => ed.institution || ed.qualification) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Qualifications</Text>
          {education
            .filter((ed) => ed.institution || ed.qualification)
            .map((ed) => (
              <View key={ed.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.companyRole}>
                    {ed.institution || "Institution"} —{" "}
                    {ed.qualification || "Qualification"}
                  </Text>
                  <Text style={styles.period}>{ed.period}</Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* References Section */}
      {references.filter(Boolean).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>References</Text>
          {references.filter(Boolean).map((ref, idx) => (
            <Text key={idx} style={styles.text}>
              {ref}
            </Text>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

// Export to PDF using @react-pdf/renderer
export const exportToPdf = async (props: ExportFunctionProps) => {
  try {
    const fileName = `${(props.personal.fullName || "CV").replace(
      /\s+/g,
      "_"
    )}_CV.pdf`;

    // Generate PDF blob
    const blob = await pdf(<CVDocument {...props} />).toBlob();

    // Save the file
    saveAs(blob, fileName);

    console.log("PDF exported successfully!");
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("Failed to export to PDF. Please try again.");
  }
};

// Export to Word (.docx) - Keep existing implementation
export const exportToDocx = async ({
  personal,
  profile,
  skills,
  experiences,
  education,
  references,
}: ExportFunctionProps) => {
  try {
    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            // Header: Name & Title
            new Paragraph({
              children: [
                new TextRun({
                  text: personal.fullName || "Your Name",
                  bold: true,
                  size: 36,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: personal.title || "Your Professional Title",
                  italics: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({ children: [new TextRun(" ")] }),

            // Contact Information
            new Paragraph({
              children: [
                new TextRun({
                  text: `Phone: ${personal.phone || "N/A"} | Email: ${
                    personal.email || "N/A"
                  } | Location: ${personal.location || "N/A"}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({ children: [new TextRun(" ")] }),

            // Profile Section
            ...(profile
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Profile", bold: true, size: 28 }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: profile, size: 22 })],
                  }),
                  new Paragraph({ children: [new TextRun(" ")] }),
                ]
              : []),

            // Skills Section
            ...(skills.filter(Boolean).length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Key Skills", bold: true, size: 28 }),
                    ],
                  }),
                  ...skills.filter(Boolean).map(
                    (skill) =>
                      new Paragraph({
                        children: [
                          new TextRun({ text: `• ${skill}`, size: 22 }),
                        ],
                      })
                  ),
                  new Paragraph({ children: [new TextRun(" ")] }),
                ]
              : []),

            // Experience Section
            ...(experiences.some((exp) => exp.company || exp.role)
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Career History",
                        bold: true,
                        size: 28,
                      }),
                    ],
                  }),
                  ...experiences
                    .filter((exp) => exp.company || exp.role)
                    .map((exp) => [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${exp.company || "Company"} — ${
                              exp.role || "Position"
                            }`,
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: exp.period || "",
                            italics: true,
                            size: 20,
                          }),
                        ],
                      }),
                      ...(exp.details
                        ? [
                            new Paragraph({
                              children: [
                                new TextRun({ text: exp.details, size: 22 }),
                              ],
                            }),
                          ]
                        : []),
                      new Paragraph({ children: [new TextRun(" ")] }),
                    ])
                    .flat(),
                ]
              : []),

            // Education Section
            ...(education.some((ed) => ed.institution || ed.qualification)
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Education & Qualifications",
                        bold: true,
                        size: 28,
                      }),
                    ],
                  }),
                  ...education
                    .filter((ed) => ed.institution || ed.qualification)
                    .map((ed) => [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${ed.institution || "Institution"} — ${
                              ed.qualification || "Qualification"
                            }`,
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: ed.period || "",
                            italics: true,
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({ children: [new TextRun(" ")] }),
                    ])
                    .flat(),
                ]
              : []),

            // References Section
            ...(references.filter(Boolean).length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "References", bold: true, size: 28 }),
                    ],
                  }),
                  ...references.filter(Boolean).map(
                    (ref) =>
                      new Paragraph({
                        children: [new TextRun({ text: ref, size: 22 })],
                      })
                  ),
                ]
              : []),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${(personal.fullName || "CV").replace(
      /\s+/g,
      "_"
    )}_CV.docx`;
    saveAs(blob, fileName);

    console.log("Word document exported successfully!");
  } catch (error) {
    console.error("Error exporting to Word:", error);
    alert("Failed to export to Word. Please try again.");
  }
};

// Keep the advanced export as a fallback (not used by default)
export const exportToPdfAdvanced = exportToPdf;
