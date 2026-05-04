"use client";
import {
  Document,
  Font,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { forwardRef, type RefObject, useImperativeHandle, useRef } from "react";

import type { ExportFunctionProps } from "../../types/global";
import { A4_PAGE_STYLE } from "../ui/printStyles";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Roboto",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",

    marginBottom: 20,
    borderBottom: "2 solid #333",
    paddingBottom: 10,
  },
  name: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 5,
  },
  title: {
    textTransform: "uppercase",
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
    textTransform: "uppercase",
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
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  companyRole: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666",
    marginBottom: 3,
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
  gridContainer: {
    display: "flex" as const,
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 6,
  },
});

// PDF Document Component
const CVDocument = ({
  personal,
  profile,
  skill,
  experiences,
  education,
  reference,
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
      {skill.filter(Boolean).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Skills</Text>
          {(() => {
            const validSkills = skill.filter(Boolean);
            const numColumns = Math.min(Math.ceil(validSkills.length / 5), 3);

            return (
              <View style={styles.gridContainer}>
                {Array.from({ length: numColumns }).map((_, colIdx) => (
                  <View key={colIdx} style={{ marginBottom: 5 }}>
                    {validSkills
                      .slice(colIdx * 5, colIdx * 5 + 5)
                      .map((skill, idx) => (
                        <Text
                          key={`${skill}-${idx}`}
                          style={styles.bulletPoint}
                        >
                          • {skill}
                        </Text>
                      ))}
                  </View>
                ))}
              </View>
            );
          })()}
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
                  <Text style={styles.companyName}>
                    {exp.company || "Company"}
                  </Text>
                  <Text style={styles.period}>{exp.period}</Text>
                </View>
                <Text style={styles.companyRole}>{exp.role || "Position"}</Text>
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

      {/* Certificate Section */}
      {/* {education.some((ed) => ed.institution || ed.qualification) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Qualifications</Text>
          {education
            .filter((ed) => ed.institution || ed.qualification)
            .map((ed) => (
              <View key={ed.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.companyRole}>
                    {ed.institution || "Certificate"} —{" "}
                    {ed.qualification || "Year Obtained"}
                  </Text>
                  <Text style={styles.period}>{ed.period}</Text>
                </View>
              </View>
            ))}
        </View>
      )} */}

      {/* References Section */}
      {reference.some((ref) => ref.name || ref.company) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>References</Text>
          {reference
            .filter((ref) => ref.name || ref.company)
            .map((ref) => (
              <Text key={ref.id} style={styles.text}>
                {ref.name || "Full name"} -{ref.company || "Company"} -
                {ref.role || "Role"} -{ref.email || "Email"} -{" "}
                {ref.phone || "Phone number"}
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
      "_",
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
  competency,
  experiences,
  education,
  certificate,
  skill,
  reference,
  additionalInfo,
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

            // Competencies Section
            ...(competency.filter(Boolean).length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Key Competencies",
                        bold: true,
                        size: 28,
                      }),
                    ],
                  }),
                  ...competency.filter(Boolean).map(
                    (competency) =>
                      new Paragraph({
                        children: [
                          new TextRun({ text: `• ${competency}`, size: 22 }),
                        ],
                      }),
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
                    .flatMap((exp) => [
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
                    ]),
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
                    .flatMap((ed) => [
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
                    ]),
                ]
              : []),

            // Skills Section
            ...(skill.filter(Boolean).length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Key Skills", bold: true, size: 28 }),
                    ],
                  }),
                  ...skill.filter(Boolean).map(
                    (skill) =>
                      new Paragraph({
                        children: [
                          new TextRun({ text: `• ${skill}`, size: 22 }),
                        ],
                      }),
                  ),
                  new Paragraph({ children: [new TextRun(" ")] }),
                ]
              : []),

            // References Section
            ...(reference.filter((r) => r && r.name).length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "References", bold: true, size: 28 }),
                    ],
                  }),
                  ...reference
                    .filter((r) => r && r.name)
                    .map(
                      (ref) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${ref.name}${ref.role ? ` - ${ref.role}` : ""}${ref.company ? ` at ${ref.company}` : ""}`,
                              size: 22,
                            }),
                          ],
                        }),
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
      "_",
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
function useReactToPrint(arg0: {
  contentRef: RefObject<HTMLDivElement | null>;
  documentTitle: string;
}) {
  throw new Error("Function not implemented.");
}
