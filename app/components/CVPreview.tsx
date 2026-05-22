// app/components/CVPreview.tsx - Section Overflow Pagination with Navigation
import { forwardRef, useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { CVPreviewProps } from "../types/global";
import { getTemplateSections, type TemplatePreviewProps } from "./templates";
import { getTemplateClasses } from "../lib/templates/tailwindStyles";
import { TEMPLATES, THEMES, FONT_PAIRS } from "../lib/templates/templateDefinitions";
import { A4_DIMENSIONS } from "./ui/printStyles";

const mmToPx = (mm: number) => (mm * 96) / 25.4;

const A4_HEIGHT_PX = mmToPx(297);
const A4_PADDING_PX = mmToPx(15);
const BOTTOM_MARGIN_PX = 50;
const USABLE_HEIGHT_PX = A4_HEIGHT_PX - 2 * A4_PADDING_PX - BOTTOM_MARGIN_PX;
const MIN_SPLIT_THRESHOLD = A4_PADDING_PX;

function resolveColors(templateId?: string, themeId?: string) {
  const template = templateId ? TEMPLATES[templateId] : null;
  if (!template) return null;
  let colors = { ...template.colorScheme };
  if (themeId) {
    const themeGroup = Object.values(THEMES).find(g => g.some(t => t.id === themeId));
    const foundTheme = themeGroup?.find(t => t.id === themeId);
    if (foundTheme) { colors = { ...foundTheme.colors }; }
  }
  return colors;
}

function resolveFontPair(fontPairId?: string) {
  if (!fontPairId) return null;
  return FONT_PAIRS.find(f => f.id === fontPairId) || null;
}

interface Section {
  key: string;
  content: ReactNode;
  estimatedHeight: number;
  canBreak: boolean;
  isOverflow?: boolean;
  clipFrom?: number;
}

const DEBUG_MODE = false;

function calculatePages(sections: Section[], pageHeight: number = USABLE_HEIGHT_PX): Section[][] {
  if (pageHeight <= 0) pageHeight = USABLE_HEIGHT_PX;

  const pages: Section[][] = [[]];
  let currentPageHeight = 0;

  sections.forEach((section) => {
    const sectionHeight = section.estimatedHeight;
    const remainingSpace = pageHeight - currentPageHeight;

    if (sectionHeight <= remainingSpace) {
      pages[pages.length - 1].push(section);
      currentPageHeight += sectionHeight;
    } else if (section.canBreak && remainingSpace > MIN_SPLIT_THRESHOLD) {
      pages[pages.length - 1].push({
        ...section,
        clipFrom: remainingSpace,
      });

      pages.push([{
        ...section,
        isOverflow: true,
        estimatedHeight: sectionHeight - remainingSpace,
      }]);

      currentPageHeight = sectionHeight - remainingSpace;
    } else {
      pages.push([section]);
      currentPageHeight = sectionHeight;
    }
  });

  return pages.filter(page => page.length > 0);
}

interface CVPreviewComponentProps extends CVPreviewProps {
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  showAllPages?: boolean;
}

const CVPreview = forwardRef<HTMLDivElement, CVPreviewComponentProps>(
  (
    {
      personal,
      profile,
      competency,
      experiences,
      education,
      certificate,
      skill,
      reference,
      additionalInfo,
      currentPage = 0,
      onTotalPagesChange,
      showAllPages = false,
      templateId = "classic",
      themeId,
      fontPairId,
      photoUrl,
    },
    ref,
  ) => {
    const [debugEnabled, setDebugEnabled] = useState(false);
    const [showBreakLines, setShowBreakLines] = useState(false);
    const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const measuredHeights = useMemo(() => new Map<string, number>(), []);

    const colors = useMemo(() => resolveColors(templateId, themeId), [templateId, themeId]);
    const fontPair = useMemo(() => resolveFontPair(fontPairId), [fontPairId]);
    const templateStyle = useMemo(() => getTemplateClasses(templateId, themeId), [templateId, themeId]);

    const templateProps: TemplatePreviewProps = useMemo(() => ({
      personal, profile, competency, experiences, education,
      certificate, skill, reference, additionalInfo,
      colors: colors || { primary: "#333", secondary: "#555", accent: "#666", text: "#333", background: "#fff" },
      fontPair: fontPair ? { heading: fontPair.heading, body: fontPair.body } : { heading: "Arial, sans-serif", body: "Arial, sans-serif" },
      photoUrl,
    }), [personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo, photoUrl, colors, fontPair]);

    const templateResult = useMemo(() => getTemplateSections(templateId, templateProps), [templateId, templateProps]);

    const sections = useMemo<Section[]>(() => {
      if (templateResult.sidebar) {
        return templateResult.sidebar.concat(templateResult.main);
      }
      return templateResult.main;
    }, [templateResult]);

    const sectionsWithHeights = useMemo(() => {
      return sections.map(section => ({
        ...section,
        actualHeight: measuredHeights.get(section.key) || section.estimatedHeight,
      }));
    }, [sections, measuredHeights]);

    const allPages = useMemo(() => {
      const sectionData = sectionsWithHeights.map(s => ({
        key: s.key,
        content: s.content,
        estimatedHeight: s.actualHeight,
        canBreak: s.canBreak,
        isOverflow: s.isOverflow,
        clipFrom: s.clipFrom,
      }));
      return calculatePages(sectionData);
    }, [sectionsWithHeights]);

    useEffect(() => {
      if (onTotalPagesChange) {
        onTotalPagesChange(allPages.length);
      }
    }, [allPages.length, onTotalPagesChange]);

    const toggleDebug = () => {
      setDebugEnabled((prev) => !prev);
    };

    const toggleBreakLines = () => {
      setShowBreakLines((prev) => !prev);
    };

    const getTotalHeight = (pageSections: Section[]) => {
      return pageSections.reduce((sum, s) => sum + s.estimatedHeight, 0);
    };

    const setSectionRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
      if (el) {
        sectionRefs.current.set(key, el);
      } else {
        sectionRefs.current.delete(key);
      }
    }, []);

    const isTwoColumn = templateId === "twoColumn";

    const displayedPages = showAllPages ? allPages : [allPages[currentPage] || allPages[0]];

    return (
      <div ref={ref} className="cv-preview-wrapper">
        {templateStyle && <style>{templateStyle}</style>}
        {DEBUG_MODE && (
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button type="button"
              onClick={toggleDebug}
              className="px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-50 hover:opacity-100"
            >
              {debugEnabled ? "Hide Heights" : "Show Heights"}
            </button>
            <button type="button"
              onClick={toggleBreakLines}
              className={`px-3 py-1 text-xs rounded opacity-50 hover:opacity-100 ${
                showBreakLines ? "bg-red-600 text-white" : "bg-gray-800 text-white"
              }`}
            >
              {showBreakLines ? "Hide Breaks" : "Show Breaks"}
            </button>
          </div>
        )}

        <style>{`
          .break-line-indicator {
            position: relative;
          }
          .break-line-indicator::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: repeating-linear-gradient(
              90deg,
              #ef4444 0,
              #ef4444 8px,
              transparent 8px,
              transparent 16px
            );
          }
          .overflow-indicator {
            position: relative;
          }
          .overflow-indicator::before {
            content: '▼ overflow';
            position: absolute;
            top: -18px;
            left: 0;
            font-size: 10px;
            color: #f97316;
            font-weight: bold;
          }
        `}</style>

        {displayedPages.length > 0 ? (
          displayedPages.map((pageSections, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              className="cv-page bg-white mx-auto shadow-lg print:shadow-none"
              style={{
                width: A4_DIMENSIONS.width,
                minHeight: A4_DIMENSIONS.height,
                height: A4_DIMENSIONS.height,
                padding: A4_DIMENSIONS.padding,
                paddingBottom: `${A4_PADDING_PX + BOTTOM_MARGIN_PX}px`,
                boxSizing: "border-box",
              }}
            >
              {debugEnabled && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs p-2 z-10 max-h-full overflow-auto">
                  <strong>Page {pageIndex + 1}:</strong>
                  <ul className="mt-1">
                    {pageSections.map((section) => {
                      const measured = measuredHeights.get(section.key);
                      const diff = measured
                        ? `(${measured - section.estimatedHeight > 0 ? '+' : ''}${measured - section.estimatedHeight}px)`
                        : '';
                      return (
                        <li key={section.key} className={section.clipFrom ? 'text-yellow-300' : ''}>
                          {section.key}: {section.estimatedHeight}px {diff}
                          {section.clipFrom && ` [SPLIT @ ${section.clipFrom}px]`}
                          {section.isOverflow && ` [CONTINUED]`}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-1 border-t pt-1">
                    Total: {getTotalHeight(pageSections)}px / {USABLE_HEIGHT_PX}px
                  </div>
                </div>
              )}
              {isTwoColumn ? (
                <div className="flex h-full">
                  <div className="w-1/3 overflow-hidden" style={{ margin: `-${A4_PADDING_PX}px`, marginRight: 0, padding: `${A4_PADDING_PX}px`, paddingRight: 0 }}>
                    {pageSections.filter(s => s.key.startsWith("sidebar-")).map(section => (
                      <div key={section.key} ref={setSectionRef(section.key)} data-measure-key={section.key}
                        className={`cv-section-wrapper ${showBreakLines && section.clipFrom ? 'break-line-indicator' : ''} ${showBreakLines && section.isOverflow ? 'overflow-indicator' : ''}`}
                        style={{ maxHeight: section.clipFrom ? `${section.clipFrom}px` : undefined, overflow: section.clipFrom ? 'hidden' : undefined }}>
                        {section.content}
                      </div>
                    ))}
                  </div>
                  <div className="w-2/3 pl-4">
                    {pageSections.filter(s => !s.key.startsWith("sidebar-")).map(section => (
                      <div key={section.key} ref={setSectionRef(section.key)} data-measure-key={section.key}
                        className={`cv-section-wrapper ${showBreakLines && section.clipFrom ? 'break-line-indicator' : ''} ${showBreakLines && section.isOverflow ? 'overflow-indicator' : ''}`}
                        style={{ maxHeight: section.clipFrom ? `${section.clipFrom}px` : undefined, overflow: section.clipFrom ? 'hidden' : undefined }}>
                        {section.content}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cv-content">
                  {pageSections.map((section) => (
                    <div
                      key={section.key}
                      ref={setSectionRef(section.key)}
                      data-measure-key={section.key}
                      className={`cv-section-wrapper ${
                        showBreakLines && section.clipFrom ? 'break-line-indicator' : ''
                      } ${showBreakLines && section.isOverflow ? 'overflow-indicator' : ''}`}
                      style={{
                        maxHeight: section.clipFrom ? `${section.clipFrom}px` : undefined,
                        overflow: section.clipFrom ? 'hidden' : undefined,
                      }}
                    >
                      {section.content}
                    </div>
                  ))}
                </div>
              )}
              {!showAllPages && (
                <div className="page-number text-xs text-gray-400 text-center absolute bottom-2 left-0 right-0">
                  Page {currentPage + 1} of {allPages.length}
                </div>
              )}
              {showAllPages && (
                <div className="page-number text-xs text-gray-400 text-center absolute bottom-2 left-0 right-0">
                  Page {pageIndex + 1} of {allPages.length}
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            className="cv-page bg-white mx-auto shadow-lg print:shadow-none"
            style={{
              width: A4_DIMENSIONS.width,
              minHeight: A4_DIMENSIONS.height,
              padding: A4_DIMENSIONS.padding,
              paddingBottom: `${A4_PADDING_PX + BOTTOM_MARGIN_PX}px`,
              boxSizing: "border-box",
            }}
          >
            {sections.map((section) => (
              <div
                key={section.key}
                ref={setSectionRef(section.key)}
                data-measure-key={section.key}
                className="cv-section-wrapper"
              >
                {section.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

CVPreview.displayName = "CVPreview";
export default CVPreview;
