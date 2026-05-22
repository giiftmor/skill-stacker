// app/components/ui/ExportModal.tsx
"use client";
import { useState } from "react";
import { exportCV, ExportFormat } from "../../lib/export/exportDispatcher";
import { TemplateId, TEMPLATES } from "../../lib/templates/templateDefinitions";

interface ExportModalProps {
  data: {
    personal: { fullName: string; title: string; phone: string; email: string; location: string; linkedin: string };
    profile: string;
    competency: string[];
    experiences: Array<{ id?: string | number; company: string; role: string; period: string; details: string }>;
    education: Array<{ id?: string | number; institution: string; qualification: string; period: string }>;
    certificate: Array<{ id?: string | number; name: string; date: string }>;
    skill: string[];
    reference: Array<{ id?: string | number; name: string; company: string; role: string; email: string; phone: string }>;
    additionalInfo: string[];
  };
  templateId?: TemplateId;
  themeId?: string;
  fontPairId?: string;
  photoUrl?: string;
  onClose?: () => void;
}

export default function ExportModal({ data, templateId, themeId, fontPairId, photoUrl, onClose }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("pdf");

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCV(format, { data, templateId, themeId, fontPairId, photoUrl });
      onClose?.();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Export CV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat("pdf")}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                format === "pdf"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-1">📄</div>
              <div className="font-medium">PDF</div>
              <div className="text-xs text-gray-500">Best for printing</div>
            </button>
            <button
              onClick={() => setFormat("docx")}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                format === "docx"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-1">📝</div>
              <div className="font-medium">Word</div>
              <div className="text-xs text-gray-500">Editable document</div>
            </button>
          </div>
        </div>

        {templateId && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Template: {TEMPLATES[templateId]?.name || templateId}</div>
            {themeId && <div className="text-sm text-gray-600">Theme: {themeId}</div>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}