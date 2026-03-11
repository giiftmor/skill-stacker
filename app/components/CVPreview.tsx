// app/components/CVPreview.tsx - Auto-Paginated Version
import React, { forwardRef, useEffect, useRef, useState } from "react";
import type { ReactNode, Key } from "react";
import type { CVPreviewProps } from "../types/global";
import FormattedText from "./FormattedText";
import { A4_DIMENSIONS } from "./ui/printStyles";

// Convert mm to pixels (96 DPI standard)
const mmToPx = (mm: number) => (mm * 96) / 25.4;

const A4_HEIGHT_PX = mmToPx(297); // 297mm = ~1122px
const A4_PADDING_PX = mmToPx(15); // 15mm padding
const USABLE_HEIGHT_PX = A4_HEIGHT_PX - 2 * A4_PADDING_PX; // ~1062px

// CV Preview Component with auto-pagination
const CVPreview = forwardRef<HTMLDivElement, CVPreviewProps>(
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
    },
    ref,
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<ReactNode[][]>([[]]);

    // Auto-paginate content based on height
    useEffect(() => {
      if (!contentRef.current) return;

      const children = Array.from(contentRef.current.children);
      const newPages: ReactNode[][] = [[]];
      let currentPageHeight = 0;
      let currentPageIndex = 0;

      children.forEach((child, index) => {
        const element = child as HTMLElement;
        const elementHeight = element.offsetHeight;

        // Check if element fits on current page
        if (
          currentPageHeight + elementHeight > USABLE_HEIGHT_PX &&
          currentPageHeight > 0
        ) {
          // Start new page
          currentPageIndex++;
          newPages[currentPageIndex] = [];
          currentPageHeight = 0;
        }

        // Clone the element to preserve it
        const clonedElement = element.cloneNode(true) as HTMLElement;
        newPages[currentPageIndex].push(
          <div
            key={`page-${currentPageIndex}-item-${index}`}
            dangerouslySetInnerHTML={{ __html: clonedElement.outerHTML }}
          />,
        );
        currentPageHeight += elementHeight;
      });

      setPages(newPages);
    }, [
      personal,
      profile,
      competency,
      experiences,
      education,
      certificate,
      skill,
      reference,
      additionalInfo,
    ]);

    const CVContent = () => (
      <>
        {/* Header */}
        <header className="pb-4 mb-6 flex flex-col items-center section-header">
          <h1 className="user-name">{personal.fullName || "Your Name"}</h1>
          <p className="professional-title">
            {personal.title || "Your Professional Title"}
          </p>
          <div className="normal-text space-x-4">
            {personal.phone && <span>{personal.phone}</span>}
            {personal.phone && personal.email && <span>|</span>}
            {personal.email && <span>{personal.email}</span>}
            {(personal.phone || personal.email) && personal.location && (
              <span>|</span>
            )}
            {personal.location && <span>{personal.location}</span>}
          </div>
          {personal.linkedin && (
            <p className="text-sm text-gray-700 mt-2">{personal.linkedin}</p>
          )}
        </header>

        {/* Profile Section */}
        {profile && (
          <section className="mb-6 cv-section">
            <p className="text-gray-700 text-sm leading-relaxed">{profile}</p>
          </section>
        )}

        {/* Core Competencies */}
        {competency.filter(Boolean).length > 0 && (
          <section className="mb-6 cv-section">
            <h2 className="heading_1">Core Competencies</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {competency.filter(Boolean).map((comp, idx) => (
                <li className="normal-text" key={`comp-${idx}`}>
                  {comp}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Career History */}
        {experiences.some((exp) => exp.company || exp.role) && (
          <section className="mb-6 cv-section">
            <h2 className="heading_1">Career History</h2>
            {experiences.map((exp) => (
              <div key={exp.id} className="mb-4 cv-section">
                <div className="flex justify-between items-start">
                  <h3 className="institution-name">
                    {exp.company || "Company Name"}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {exp.period}
                  </span>
                </div>
                <h4 className="text-gray-800 mb-3">
                  {exp.role || "Job Title"}
                </h4>
                {exp.details && (
                  <FormattedText
                    children={String(exp.details)}
                    className="normal-text"
                  />
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education & Qualifications */}
        {education.some((ed) => ed.institution || ed.qualification) && (
          <section className="mb-6 cv-section">
            <h2 className="heading_1">Education & Qualifications</h2>
            {education.map((ed) => (
              <div key={ed.id} className="mb-3 cv-section">
                <div className="flex justify-between items-start">
                  <h3 className="institution-name">
                    {ed.institution || "Institution"}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {ed.period}
                  </span>
                </div>
                <h4 className="text-gray-800 mb-1">
                  {ed.qualification || "Qualification"}
                </h4>
              </div>
            ))}
          </section>
        )}

        {/* Certificates */}
        {certificate.some((cert) => cert.name || cert.date) && (
          <section className="mb-6 cv-section">
            <h2 className="heading_1">Certificates</h2>
            {certificate.map((cert) => (
              <div key={cert.id} className="mb-3 cv-section">
                <div className="flex items-start">
                  <h3 className="font-semibold text-gray-900 uppercase">
                    {cert.name || "Certificate"}
                  </h3>
                  <span className="mx-1 text-sm text-gray-600 font-medium">
                    ({cert.date})
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Technical Skills */}
        {skill.filter(Boolean).length > 0 && (
          <section className="mb-6 cv-section">
            <h2 className="heading_1">Technical Skills</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {skill.filter(Boolean).map((s, idx) => (
                <li className="normal-text" key={`skill-${idx}`}>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* References */}
        {reference.some((ref) => ref.name || ref.company) && (
          <section className="mb-6 cv-section">
            <h2 className="heading_1">References</h2>
            {reference.map((ref) => (
              <div key={ref.id} className="mb-3 cv-section">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-gray-900">
                    {ref.name || "Reference available upon request"}
                  </h3>
                  {ref.role && <span>{ref.role}</span>}
                  {ref.company && (
                    <span className="text-sm text-gray-600 font-medium">
                      {ref.company}
                    </span>
                  )}
                  {ref.email && <span>{ref.email}</span>}
                  {ref.phone && <span>{ref.phone}</span>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Additional Information */}
        {additionalInfo.filter(Boolean).length > 0 && (
          <section className="mb-6 cv-section">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
              Additional Information
            </h2>
            {additionalInfo
              .filter(Boolean)
              .map((info: ReactNode, idx: Key | null | undefined) => (
                <div key={idx} className="mb-2 text-gray-700">
                  {info}
                </div>
              ))}
          </section>
        )}
      </>
    );

    return (
      <div ref={ref} className="cv-preview-wrapper">
        {/* Hidden content measurer */}
        <div
          ref={contentRef}
          className="hidden-measurer"
          style={{
            position: "absolute",
            left: "-9999px",
            width: A4_DIMENSIONS.width,
            padding: A4_DIMENSIONS.padding,
          }}
        >
          <CVContent />
        </div>

        {/* Visible paginated content */}
        {pages.length > 0 ? (
          pages.map((pageContent, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              className="cv-page bg-white mx-auto shadow-lg print:shadow-none mb-6 last:mb-0"
              style={{
                width: A4_DIMENSIONS.width,
                minHeight: A4_DIMENSIONS.height,
                height: A4_DIMENSIONS.height,
                padding: A4_DIMENSIONS.padding,
                overflow: "hidden",
              }}
            >
              <div className="cv-content">{pageContent}</div>
              {/* <div className="page-number text-xs text-gray-400 text-center mt-4 print:hidden">
                Page {pageIndex + 1} of {pages.length}
              </div> */}
            </div>
          ))
        ) : (
          // Fallback: render as single page if pagination fails
          <div
            className="cv-page bg-white mx-auto shadow-lg print:shadow-none"
            style={{
              width: A4_DIMENSIONS.width,
              minHeight: A4_DIMENSIONS.height,
              padding: A4_DIMENSIONS.padding,
            }}
          >
            <CVContent />
          </div>
        )}
      </div>
    );
  },
);

CVPreview.displayName = "CVPreview";
export default CVPreview;
