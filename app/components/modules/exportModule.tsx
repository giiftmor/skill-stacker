"use client";
// Required imports
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Type definitions
import type { ExportFunctionProps } from "../../types/global";

// Export to Word (.docx)
export const exportToDocx = async ({
  personal,
  profile,
  skills,
  experiences,
  education,
  references,
}: ExportFunctionProps) => {
  try {
    const doc = new Document({
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

// Export to PDF using jsPDF and html2canvas
export const exportToPdf = async ({
  previewRef,
  personal,
}: ExportFunctionProps) => {
  try {
    if (!previewRef?.current) {
      console.error("Preview reference not available");
      alert(
        "Preview content not available for PDF export. Make sure the CV preview is visible."
      );
      return;
    }

    const element = previewRef.current;
    const fileName = `${(personal.fullName || "CV").replace(
      /\s+/g,
      "_"
    )}_CV.pdf`;

    // Create a temporary clone to avoid CSS issues
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Apply inline styles to avoid CSS parsing issues
    const applyInlineStyles = (elem: HTMLElement) => {
      const computedStyle = window.getComputedStyle(elem);

      // Convert computed styles to inline styles
      elem.style.cssText = "";
      for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i];
        const value = computedStyle.getPropertyValue(property);

        // Skip problematic CSS functions
        if (
          value.includes("lab(") ||
          value.includes("oklch(") ||
          value.includes("color(")
        ) {
          continue;
        }

        elem.style.setProperty(property, value);
      }

      // Process all child elements
      Array.from(elem.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          applyInlineStyles(child);
        }
      });
    };

    // Append clone to body temporarily
    document.body.appendChild(clonedElement);
    clonedElement.style.position = "absolute";
    clonedElement.style.left = "-9999px";
    clonedElement.style.top = "0";

    // Apply inline styles to avoid CSS parsing issues
    applyInlineStyles(clonedElement);

    // Configure html2canvas options to avoid CSS parsing issues
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      ignoreElements: (element) => {
        // Ignore elements with problematic CSS
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;

        return (
          color.includes("lab(") ||
          color.includes("oklch(") ||
          backgroundColor.includes("lab(") ||
          backgroundColor.includes("oklch(")
        );
      },
      onclone: (clonedDoc) => {
        // Additional cleanup in the cloned document
        const clonedElements = clonedDoc.querySelectorAll("*");
        clonedElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            const style = el.style;
            // Remove problematic CSS properties
            ["color", "background-color", "border-color"].forEach((prop) => {
              const value = style.getPropertyValue(prop);
              if (
                value &&
                (value.includes("lab(") || value.includes("oklch("))
              ) {
                style.removeProperty(prop);
              }
            });
          }
        });
      },
    });

    // Remove the temporary clone
    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL("image/png");

    // Calculate dimensions to fit A4
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF("portrait", "mm", "a4");
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(fileName);
    console.log("PDF exported successfully!");
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("Failed to export to PDF. Please try again.");
  }
};

// Alternative PDF export with better page handling
export const exportToPdfAdvanced = async ({
  previewRef,
  personal,
}: ExportFunctionProps) => {
  try {
    if (!previewRef?.current) {
      console.error("Preview reference not available");
      alert("Preview content not available for PDF export.");
      return;
    }

    const element = previewRef.current;
    const fileName = `${(personal.fullName || "CV").replace(
      /\s+/g,
      "_"
    )}_CV.pdf`;

    // Create canvas with high quality settings
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // PDF dimensions (A4)
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Calculate image dimensions to fit PDF width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: imgHeight > pdfHeight ? "portrait" : "portrait",
      unit: "mm",
      format: "a4",
    });

    // If image height is less than PDF height, center it
    if (imgHeight <= pdfHeight) {
      const yOffset = (pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, "JPEG", 0, yOffset, imgWidth, imgHeight);
    } else {
      // If image is taller, split across pages
      let yPosition = 0;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        const pageHeight = Math.min(pdfHeight, remainingHeight);

        if (yPosition > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, -yPosition, imgWidth, imgHeight);

        yPosition += pdfHeight;
        remainingHeight -= pdfHeight;
      }
    }

    pdf.save(fileName);
    console.log("Advanced PDF exported successfully!");
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("Failed to export to PDF. Please try again.");
  }
};

// Demo versions (when packages aren't installed)
export const exportToDocxDemo = () => {
  alert(
    "Word export feature requires 'docx' and 'file-saver' packages to be installed.\n\nRun: npm install docx file-saver"
  );
};

export const exportToPdfDemo = () => {
  alert(
    "PDF export feature requires 'jspdf' and 'html2canvas' packages to be installed.\n\nRun: npm install jspdf html2canvas"
  );
};
