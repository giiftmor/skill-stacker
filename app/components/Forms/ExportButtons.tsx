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
  <div className="flex gap-2 mt-6 pt-4 border-t border-[#333]">
    <button
      className="flex-1 px-4 py-2 bg-[#d4a853] text-[#0d0d0d] rounded-md hover:bg-[#b8923e] transition-all duration-200 font-medium"
      onClick={exportToDocx}
    >
      Word
    </button>
    <button
      className="flex-1 px-4 py-2 bg-[#242424] text-[#e8e6e3] border border-[#333] rounded-md hover:border-[#d4a853] transition-all duration-200 font-medium"
      onClick={exportToPdf}
    >
      PDF
    </button>
    <button
      onClick={printToPdf}
      className="px-6 py-2 bg-[#242424] text-[#e8e6e3] border border-[#333] rounded-lg hover:border-[#d4a853] transition-all duration-200 font-medium shadow-md flex items-center gap-2"
    >
      Print to PDF
    </button>
  </div>
);

export default ExportButtons;
