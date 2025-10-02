// Export Buttons Component
import React from "react";
import type { ExportButtonsProps } from "../types/global";

const ExportButtons = ({ exportToDocx, exportToPdf }: ExportButtonsProps) => (
  <div className="flex gap-2 mt-6 pt-4 border-t">
    <button
      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
      onClick={exportToDocx}
    >
      Export as Word
    </button>
    <button
      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
      onClick={exportToPdf}
    >
      Export as PDF
    </button>
  </div>
);

export default ExportButtons;
