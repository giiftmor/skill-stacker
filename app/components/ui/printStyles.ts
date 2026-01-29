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
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: white !important;
    }
    

    /* Remove shadows/rounded corners in print only */
    * {
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    /* ✅ Allow long sections to split naturally across pages */
    section {
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    /* Keep headings near their content without being overly strict */
    h1, h2, h3, h4, h5, h6 {
      break-after: avoid-page;
      page-break-after: avoid;
    }

    /* Reasonable paragraph/list widows/orphans for professional look */
    p, li {
      orphans: 3;
      widows: 3;
    }

    /* Keep a single list item together; fine to split between items */
    li, .mb-3 {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Paragraph blocks may break if needed */
    .mb-4 {
      page-break-inside: auto;
      break-inside: auto;
    }
  }
`;

/**
 * A4 dimensions and styling classes
 */
export const A4_DIMENSIONS = {
  width: "210mm", // A4 width
  height: "297mm", // A4 height
  padding: "15mm", // Standard margin
  maxWidth: "180mm", // Width minus margins (210mm - 2*15mm)
} as const;
