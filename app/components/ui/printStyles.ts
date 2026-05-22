// app/ui/printStyles.ts

/**
 * Shared A4 print styles constant
 * Used by both CVPreviewWrapper (for print) and CVPreview (for preview styling)
 */
export const A4_PAGE_STYLE = `
  @page {
    size: A4;
    margin: 15mm;
  }
  
  @media print {
    html, body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      background: white !important;
    }

    /* Allow content to flow naturally */
    .cv-section-wrapper {
      page-break-inside: auto;
      break-inside: auto;
    }

    /* Prevent orphan lines */
    p, li, div {
      orphans: 2;
      widows: 2;
    }

    /* Hide dev indicators in print */
    .break-line-indicator::after,
    .overflow-indicator::before {
      display: none !important;
    }

    /* Remove shadows/bounded corners in print */
    * {
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    /* Professional heading behavior */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Allow list items to break if needed */
    li {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`;

/**
 * A4 dimensions and styling classes
 */
export const A4_DIMENSIONS = {
  width: "210mm",
  height: "297mm",
  padding: "15mm",
  maxWidth: "180mm",
} as const;