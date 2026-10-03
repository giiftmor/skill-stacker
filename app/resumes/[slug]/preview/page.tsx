// app/resumes/[slug]/preview/page.tsx - Full Screen Preview with Pagination
"use client";
import { use, useEffect, useState } from "react";
import CVPreviewWrapper from "../../../components/CVPreviewWrapper";
import AppShell from "../../../components/ui/AppShell";
import { useFitScale } from "../../../hooks/useFitScale";
import type { TemplateSettings } from "../../../lib/templates/templateDefinitions";

const PAGE_KEYS_FORWARD = new Set(["ArrowRight", "PageDown"]);
const PAGE_KEYS_BACK = new Set(["ArrowLeft", "PageUp"]);

const A4_WIDTH_PX = 794; // 210mm at 96dpi
const A4_HEIGHT_PX = 1123; // 297mm at 96dpi

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function PreviewResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [personal, setPersonal] = useState({
    fullName: "",
    title: "",
    phone: "",
    email: "",
    location: "",
    linkedin: "",
  });
  const [profile, setProfile] = useState("");
  const [competency, setCompetencies] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any[]>([]);
  const [skill, setSkills] = useState<string[]>([]);
  const [reference, setReference] = useState<any[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<string[]>([]);
  const [templateSettings, setTemplateSettings] =
    useState<TemplateSettings | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { fitRef, scale } = useFitScale(!loading);

  useEffect(() => {
    loadCV();
  }, [slug]);

  const loadCV = async () => {
    try {
      const response = await fetch(`/api/resume/${slug}`);
      const data = await response.json();
      if (data.success && data.cv) {
        const cv = data.cv;
        setPersonal({
          fullName: cv.full_name || "",
          title: cv.title || "",
          phone: cv.phone || "",
          email: cv.email || "",
          location: cv.location || "",
          linkedin: cv.linkedin || "",
        });
        setProfile(cv.profile || "");
        setCompetencies(cv.competency || []);
        setExperiences(cv.experiences || []);
        setEducation(cv.education || []);
        setCertificate(cv.certificate || []);
        setSkills(cv.skill || []);
        setReference(cv.reference || []);
        setAdditionalInfo(cv.additionalInfo || []);
        if (cv.template_settings) {
          setTemplateSettings(cv.template_settings);
        }
        setPhotoUrl(`/api/photo/${cv.id}`);
      }
    } catch (err) {
      console.error("Failed to load CV:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const forward = PAGE_KEYS_FORWARD.has(key);
      const back = PAGE_KEYS_BACK.has(key);
      if (!forward && !back) return;
      if (isTypingTarget(event.target)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (forward) {
        setCurrentPage((p) => Math.min(Math.max(totalPages - 1, 0), p + 1));
      } else {
        setCurrentPage((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [totalPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center animate-pulse-subtle text-muted">
        Loading...
      </div>
    );
  }

  return (
    <AppShell active="preview" slug={slug} title={personal.fullName}>
      <div className="flex min-h-0 flex-1 flex-col bg-canvas print:block">
        <div className="no-print flex flex-1 flex-col">
          <div className="flex items-center justify-end gap-2 px-4 pt-4">
            <button
              onClick={() => window.print()}
              className="flex min-h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-surface transition-colors hover:bg-desk hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Print / Save PDF
            </button>
          </div>

          <main className="no-print flex flex-1 items-center justify-center px-4 py-6">
            <div className="flex w-full max-w-4xl items-center gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full border border-hairline bg-surface text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div
                ref={fitRef}
                className="flex min-w-0 flex-1 justify-center"
                data-testid="cv-slide"
              >
                <div
                  className="shrink-0"
                  style={{
                    width: (A4_WIDTH_PX + 16) * scale,
                    height: (A4_HEIGHT_PX + 24 + 16) * scale,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: A4_WIDTH_PX,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <CVPreviewWrapper
                      personal={personal}
                      profile={profile}
                      competency={competency}
                      experiences={experiences}
                      education={education}
                      certificate={certificate}
                      skill={skill}
                      reference={reference}
                      additionalInfo={additionalInfo}
                      templateId={templateSettings?.template}
                      themeId={templateSettings?.theme}
                      fontPairId={templateSettings?.fontPair}
                      photoUrl={photoUrl}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      onTotalPagesChange={setTotalPages}
                      showAllPages={false}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full border border-hairline bg-surface text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </main>

          <div
            className="no-print fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-hairline bg-surface px-4 py-2"
            data-testid="page-controls"
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface text-ink hover:bg-desk disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous page (pager)"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span
              className="min-w-[60px] text-center text-sm font-medium text-ink"
              data-testid="page-indicator"
            >
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface text-ink hover:bg-desk disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next page (pager)"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div id="cv-print-area" className="print-area">
          <CVPreviewWrapper
            personal={personal}
            profile={profile}
            competency={competency}
            experiences={experiences}
            education={education}
            certificate={certificate}
            skill={skill}
            reference={reference}
            additionalInfo={additionalInfo}
            templateId={templateSettings?.template}
            themeId={templateSettings?.theme}
            fontPairId={templateSettings?.fontPair}
            photoUrl={photoUrl}
            showAllPages={true}
          />
        </div>
      </div>
    </AppShell>
  );
}
