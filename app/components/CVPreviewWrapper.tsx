// app/components/CVPreviewWrapper.tsx - Optimized Version
import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import CVPreview from "./CVPreview";
import type { CVPreviewProps } from "../types/global";
import { A4_PAGE_STYLE } from "./ui/printStyles";

export interface CVPreviewWrapperHandle {
  print: () => void;
}

const CVPreviewWrapper = forwardRef<CVPreviewWrapperHandle, CVPreviewProps>(
  (props, ref) => {
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `CV_${props.personal?.fullName?.replace(/\s+/g, "_") || "Document"}`,
      pageStyle: A4_PAGE_STYLE,
    });

    useImperativeHandle(ref, () => {
      return {
        print: handlePrint,
      };
    });

    return (
      <div ref={printRef} className="lg:col-span-2">
        <CVPreview {...props} />
      </div>
    );
  },
);

CVPreviewWrapper.displayName = "CVPreviewWrapper";
export default CVPreviewWrapper;
