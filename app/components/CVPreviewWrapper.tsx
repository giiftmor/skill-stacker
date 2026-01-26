// app/components/CVPreviewWrapper.tsx
import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import CVPreview from "./CVPreview";
import type { CVPreviewProps } from "../types/global";

type CVPreviewWrapperProps = CVPreviewProps & {
  className?: string;
  showExportButton?: boolean;
};

const CVPreviewWrapper = forwardRef<HTMLDivElement, CVPreviewWrapperProps>(
  ({ showExportButton = true, ...props }, ref) => {
    const printRef = useRef<HTMLDivElement>(null);

    // Expose the ref to parent components
    useImperativeHandle(ref, () => printRef.current as HTMLDivElement);

    const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `CV_${props.personal?.fullName?.replace(/\s+/g, "_") || "Document"}`,
      pageStyle: `
        @page {
          size: A4;
          margin: 15mm;
        }
        
        @media print {
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
          }
          
          /* Remove shadows and rounded corners in print */
          * {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Prevent awkward section breaks */
          section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Keep section headers with their content */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Keep list items together */
          li, .mb-3 {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Keep paragraphs together */
          .mb-4 {
            page-break-inside: auto;
            break-inside: auto;
          }
        }
      `,
    });

    return (
      <div className={`lg:col-span-2 w-full ${props.className || ""}`}>
        {/* Export Button - Hidden during print */}
        {showExportButton && (
          <div className="no-print mb-4 flex justify-end">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as PDF
            </button>
          </div>
        )}

        {/* CV Preview - This is what gets printed */}
        <div ref={printRef}>
          <CVPreview {...props} />
        </div>

        {/* Hide export button during print */}
        <style jsx>{`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  },
);

CVPreviewWrapper.displayName = "CVPreviewWrapper";
export default CVPreviewWrapper;
