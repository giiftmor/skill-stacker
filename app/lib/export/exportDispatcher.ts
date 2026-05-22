// app/lib/export/exportDispatcher.ts - Export dispatcher
import { saveAs } from "file-saver";
import { generatePDF } from "./pdfExport";
import { generateDocx } from "./docxExport";
import { TemplateId } from "../templates/templateDefinitions";
import { PDFExportData } from "./pdfExport";
import { DocxExportData } from "./docxExport";

export type ExportFormat = "pdf" | "docx";

interface ExportOptions {
  data: PDFExportData;
  templateId?: TemplateId;
  themeId?: string;
  fontPairId?: string;
  photoUrl?: string;
}

export async function exportCV(
  format: ExportFormat,
  options: ExportOptions
): Promise<void> {
  const { data, templateId = "classic", themeId, fontPairId, photoUrl } = options;
  
  const fileName = `${(data.personal.fullName || "CV").replace(/\s+/g, "_")}_CV`;

  try {
    if (format === "pdf") {
      const blob = await generatePDF(data, templateId, themeId, fontPairId, photoUrl);
      saveAs(blob, `${fileName}.pdf`);
    } else if (format === "docx") {
      const blob = await generateDocx(data as DocxExportData, templateId, themeId, fontPairId, photoUrl);
      saveAs(blob, `${fileName}.docx`);
    }
  } catch (error) {
    console.error(`Export to ${format} failed:`, error);
    throw error;
  }
}

export async function exportCVToBlob(
  format: ExportFormat,
  options: ExportOptions
): Promise<Blob> {
  const { data, templateId = "classic", themeId, fontPairId, photoUrl } = options;
  
  if (format === "pdf") {
    return generatePDF(data, templateId, themeId, fontPairId, photoUrl);
  } else if (format === "docx") {
    return generateDocx(data as DocxExportData, templateId, themeId, fontPairId, photoUrl);
  }
  
  throw new Error(`Unsupported format: ${format}`);
}