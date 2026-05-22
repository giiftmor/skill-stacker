// app/components/CVPreviewWrapper.tsx - Optimized Version with Pagination
import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import CVPreview from "./CVPreview";
import type { CVPreviewProps } from "../types/global";

export interface CVPreviewWrapperHandle {
  print: () => void;
}

interface CVPreviewWrapperProps extends CVPreviewProps {
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  showAllPages?: boolean;
}

const CVPreviewWrapper = forwardRef<CVPreviewWrapperHandle, CVPreviewWrapperProps>(
  (props, ref) => {
    const { currentPage = 0, onPageChange, onTotalPagesChange, showAllPages = false, ...restProps } = props;
    const [pages, setPages] = useState<any[]>([]);

    useImperativeHandle(ref, () => {
      return {
        print: () => {
          window.print();
        },
      };
    });

    return (
      <div className="lg:col-span-2">
        <CVPreview
          {...restProps}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onTotalPagesChange={onTotalPagesChange}
          showAllPages={showAllPages}
        />
      </div>
    );
  },
);

CVPreviewWrapper.displayName = "CVPreviewWrapper";
export default CVPreviewWrapper;
