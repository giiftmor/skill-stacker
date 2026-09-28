// app/cvs/[id]/preview/page.tsx - Full Screen Preview with Pagination
"use client";
import { useState, useEffect, use } from "react";
import Header from "../../../components/ui/Header";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import CVPreviewWrapper from "../../../components/CVPreviewWrapper";
import type { TemplateSettings } from "../../../lib/templates/templateDefinitions";

const PAGE_KEYS_FORWARD = new Set(["ArrowRight", "PageDown"]);
const PAGE_KEYS_BACK = new Set(["ArrowLeft", "PageUp"]);

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function PreviewCVPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const cvId = parseInt(resolvedParams.id, 10);

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
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCV();
  }, [cvId]);

  const loadCV = async () => {
    try {
      const response = await fetch(`/api/cv/${cvId}`);
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
        setPhotoUrl(`/api/photo/${cvId}`);
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
    return <div className="min-h-screen bg-canvas flex items-center justify-center animate-pulse-subtle text-muted">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="no-print">
        <Header
          title="Preview CV"
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-accent text-white hover:bg-accent rounded font-semibold"
              >
                Print / Save PDF
              </button>
            </div>
          }
        />
        <Breadcrumb
          items={[
            { label: "My CVs", href: "/cvs" },
            { label: personal.fullName || "Preview", href: `/cvs/${cvId}/edit` },
            { label: "Preview" },
          ]}
        />
      </div>

      <main className="no-print flex-1 flex items-center justify-center px-4 py-8">
        <div className="flex items-center gap-4 w-full max-w-4xl">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex-shrink-0 w-12 h-12 bg-surface border border-hairline rounded-full flex items-center justify-center text-ink hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 flex justify-center" data-testid="cv-slide">
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

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex-shrink-0 w-12 h-12 bg-surface border border-hairline rounded-full flex items-center justify-center text-ink hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      <div
        className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-hairline rounded-full px-4 py-2 flex items-center gap-3"
        data-testid="page-controls"
      >
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="w-8 h-8 rounded-full bg-surface hover:bg-desk flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-ink"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="text-sm font-medium text-ink min-w-[60px] text-center"
          data-testid="page-indicator"
        >
          {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage >= totalPages - 1}
          className="w-8 h-8 rounded-full bg-surface hover:bg-desk flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-ink"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div id="cv-print-area" className="hidden print:block">
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
  );
}
