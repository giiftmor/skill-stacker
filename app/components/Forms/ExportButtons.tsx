// Export Buttons Component
import React from "react";
import type { ExportButtonsProps } from "../../types/global";

interface ExtendededExportButtonsProps extends ExportButtonsProps {
  printToPdf?: () => void;
}

const ExportButtons = ({
  exportToDocx,
  exportToPdf,
  printToPdf,
}: ExtendededExportButtonsProps) => (
  <div className="flex gap-2 mt-6 pt-4 border-t border-hairline">
    <button
      className="flex-1 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent transition-all duration-200 font-medium"
      onClick={exportToDocx}
    >
      Word
    </button>
    <button
      className="flex-1 px-4 py-2 bg-surface text-ink border border-hairline rounded-md hover:border-accent transition-all duration-200 font-medium"
      onClick={exportToPdf}
    >
      PDF
    </button>
    <button
      onClick={printToPdf}
      className="px-6 py-2 bg-surface text-ink border border-hairline rounded-lg hover:border-accent transition-all duration-200 font-medium shadow-md flex items-center gap-2"
    >
      Print to PDF
    </button>
  </div>
);

export default ExportButtons;
