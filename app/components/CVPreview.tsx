// app/components/CVPreview.tsx - Measured A4 block pagination with editor hooks

import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useCallback, useEffect } from "react";
import { usePagination } from "../hooks/usePagination";
import type { SectionKey } from "../lib/readiness";
import type { CVPreviewProps } from "../types/global";
import FormattedText from "./FormattedText";

type Item = { id: string; node: ReactNode };
type Block = { id: string; key: SectionKey; node: ReactNode };

interface CVPreviewComponentProps extends CVPreviewProps {
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  showAllPages?: boolean;
  onSectionClick?: (key: string) => void;
  highlightKey?: string | null;
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
      className,
      previewRef,
      currentPage = 0,
      onPageChange,
      onTotalPagesChange,
      showAllPages = false,
      onSectionClick,
      highlightKey = null,
    },
    ref,
  ) => {
    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
        if (typeof previewRef === "function") previewRef(node);
        else if (previewRef) previewRef.current = node;
      },
      [ref, previewRef],
    );

    const blocks: Block[] = [];

    // The heading travels with the first item of its section so a heading is
    // never left alone at the bottom of a page.
    const section = (title: string, key: SectionKey, items: Item[]) => {
      items.forEach((item, i) => {
        blocks.push({
          id: `${key}-${item.id}`,
          key,
          node: (
            <>
              {i === 0 && <h2 className="heading_1">{title}</h2>}
              {item.node}
            </>
          ),
        });
      });
    };

    blocks.push({
      id: "personal-header",
      key: "personal",
      node: (
        <header className="flex flex-col items-center">
          <h1 className="user-name">{personal.fullName || "Your Name"}</h1>
          <p className="professional-title">
            {personal.title || "Your Professional Title"}
          </p>
          <div className="normal-text space-x-4">
            {[personal.phone, personal.email, personal.location]
              .filter(Boolean)
              .join("  |  ")}
          </div>
        </header>
      ),
    });

    if (profile) {
      blocks.push({
        id: "profile-body",
        key: "profile",
        node: <p className="normal-text">{profile}</p>,
      });
    }

    section(
      "Core Competencies",
      "competency",
      competency.filter(Boolean).map((c, i) => ({
        id: `${i}-${c}`,
        node: <li className="normal-text ml-5 list-disc">{c}</li>,
      })),
    );

    section(
      "Career History",
      "experiences",
      experiences
        .filter((e) => e.company || e.role)
        .map((exp, i) => ({
          id: `${i}-${exp.id ?? ""}-${exp.company}-${exp.period}-${exp.role}`,
          node: (
            <div>
              <div className="flex justify-between">
                <h3 className="institution-name">{exp.company}</h3>
                <span className="text-sm text-gray-600">{exp.period}</span>
              </div>
              <h4 className="text-gray-800 mb-2">{exp.role}</h4>
              {exp.details && (
                <FormattedText className="normal-text">
                  {String(exp.details)}
                </FormattedText>
              )}
            </div>
          ),
        })),
    );

    section(
      "Education & Qualifications",
      "education",
      education
        .filter((e) => e.institution || e.qualification)
        .map((ed, i) => ({
          id: `${i}-${ed.id ?? ""}-${ed.institution}-${ed.qualification}`,
          node: (
            <div>
              <div className="flex justify-between">
                <h3 className="institution-name">{ed.institution}</h3>
                <span className="text-sm text-gray-600">{ed.period}</span>
              </div>
              <h4 className="text-gray-800">{ed.qualification}</h4>
            </div>
          ),
        })),
    );

    section(
      "Certificates",
      "certificate",
      certificate
        .filter((c) => c.name || c.date)
        .map((c, i) => ({
          id: `${i}-${c.id ?? ""}-${c.name}-${c.date}`,
          node: (
            <p className="normal-text">
              <strong className="uppercase">{c.name}</strong> ({c.date})
            </p>
          ),
        })),
    );

    section(
      "Technical Skills",
      "skill",
      skill.filter(Boolean).map((s, i) => ({
        id: `${i}-${s}`,
        node: <li className="normal-text ml-5 list-disc">{s}</li>,
      })),
    );

    section(
      "References",
      "reference",
      reference
        .filter((r) => r.name || r.company)
        .map((r, i) => ({
          id: `${i}-${r.id ?? ""}-${r.name}-${r.company}`,
          node: (
            <div className="normal-text flex flex-col">
              <strong>{r.name}</strong>
              <span>{r.role}</span>
              <span>{r.company}</span>
              <span>{r.email}</span>
              <span>{r.phone}</span>
            </div>
          ),
        })),
    );

    section(
      "Additional Information",
      "additionalInfo",
      additionalInfo.filter(Boolean).map((t, i) => ({
        id: `${i}-${t}`,
        node: <p className="normal-text">{t}</p>,
      })),
    );

    const { measurerRef, pages } = usePagination(blocks.length);

    useEffect(() => {
      onTotalPagesChange?.(pages.length);
    }, [pages.length, onTotalPagesChange]);

    useEffect(() => {
      if (currentPage > pages.length - 1) {
        onPageChange?.(Math.max(0, pages.length - 1));
      }
    }, [currentPage, pages.length, onPageChange]);

    const start = Math.max(0, currentPage);
    const sliced = showAllPages ? pages : pages.slice(start, start + 1);
    const displayedPages = sliced.length > 0 ? sliced : pages.slice(0, 1);

    const blockProps = (key: SectionKey) => {
      if (!onSectionClick) return {};
      return {
        role: "button",
        tabIndex: 0,
        "aria-label": `Edit section ${key}`,
        onClick: () => onSectionClick(key),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSectionClick(key);
          }
        },
      };
    };

    return (
      <div ref={setRootRef} className={className}>
        <div className="cv-measurer" ref={measurerRef} aria-hidden>
          {blocks.map((block) => (
            <div key={block.id} className="cv-block">
              {block.node}
            </div>
          ))}
        </div>

        {displayedPages.map((blockIndexes) => (
          <div
            key={blockIndexes.length ? blocks[blockIndexes[0]].id : "page"}
            className="cv-page"
          >
            {blockIndexes.map((blockIndex) => {
              const { id, key, node } = blocks[blockIndex];
              return (
                <div
                  key={id}
                  className={`cv-block ${
                    highlightKey === key ? "ring-accent ring-2" : ""
                  }`}
                  data-cvkey={key}
                  {...blockProps(key)}
                >
                  {node}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
);

CVPreview.displayName = "CVPreview";
export default CVPreview;
