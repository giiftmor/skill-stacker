// app/cvs/[id]/preview/page.tsx - Full Screen Preview with Pagination
"use client";
import { useState, useEffect, use } from "react";
import Header from "../../../components/ui/Header";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import CVPreviewWrapper from "../../../components/CVPreviewWrapper";
import type { TemplateSettings } from "../../../lib/templates/templateDefinitions";

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
  const [showPrint, setShowPrint] = useState(true);
  const printRef = { current: null as any };

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

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      const printContent = document.getElementById("cv-print-area");
      if (printContent) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write("<!DOCTYPE html>");
          printWindow.document.write("<html><head><title>CV</title>");
          printWindow.document.write("<style>");
          printWindow.document.write(`
            @page { size: A4; margin: 0; }
            body { margin: 0; }
            .cv-page { page-break-after: always; }
            .cv-page:last-child { page-break-after: auto; }
          `);
          printWindow.document.write("</style>");
          printWindow.document.write("</head><body>");
          printWindow.document.write(printContent.innerHTML);
          printWindow.document.write("</body></html>");
          printWindow.document.close();
          printWindow.print();
        }
      }
    }, 100);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center animate-pulse-subtle text-[#8a8a8a]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header
        title="Preview CV"
        actions={
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#d4a853] text-[#0d0d0d] hover:bg-[#b8923e] rounded font-semibold"
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
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="flex items-center gap-4 w-full max-w-4xl">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex-shrink-0 w-12 h-12 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center text-[#e8e6e3] hover:border-[#d4a853] hover:text-[#d4a853] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 flex justify-center">
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
              showAllPages={showPrint}
            />
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex-shrink-0 w-12 h-12 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center text-[#e8e6e3] hover:border-[#d4a853] hover:text-[#d4a853] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-[#e8e6e3]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-[#e8e6e3] min-w-[60px] text-center">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage >= totalPages - 1}
          className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-[#e8e6e3]"
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
