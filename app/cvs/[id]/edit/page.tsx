// app/cvs/[id]/edit/page.tsx - Edit CV
"use client";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import CVPreview from "../../../components/CVPreview";
import AdditionalInfoForm from "../../../components/Forms/AdditionalInfoForm";
import CertificatesForm from "../../../components/Forms/CertificatesForm";
import CompetenciesForm from "../../../components/Forms/CompetenciesForm";
import EducationForm from "../../../components/Forms/EducationForm";
import ExperienceForm from "../../../components/Forms/ExperienceForm";
import PersonalInfoForm from "../../../components/Forms/PersonalInfoForm";
import ProfileForm from "../../../components/Forms/ProfileForm";
import ReferencesForm from "../../../components/Forms/ReferencesForm";
import SkillsForm from "../../../components/Forms/SkillsForm";
import { TailorPanel } from "../../../components/tailor/TailorPanel";
import { CommandMenu } from "../../../components/ui/CommandMenu";
import { EditorialChrome } from "../../../components/ui/EditorialChrome";
import { InspectorRail } from "../../../components/ui/InspectorRail";
import { SectionEditor } from "../../../components/ui/SectionEditor";
import UploadPhoto from "../../../components/ui/UploadPhoto";
import VersionHistory from "../../../components/ui/VersionHistory";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { exportCV } from "../../../lib/export/exportDispatcher";
import {
  cvReadiness,
  SECTION_LABELS,
  type SectionKey,
} from "../../../lib/readiness";
import { applyExperienceUpdates } from "../../../lib/tailor/applyExperiences";
import type { TailorApplyUpdate } from "../../../lib/tailor/types";
import type {
  TemplateId,
  TemplateSettings,
} from "../../../lib/templates/templateDefinitions";
import type {
  Certificate,
  Education,
  Experience,
  PersonalInfo,
  Reference,
} from "../../../types/global";

export default function EditCVPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const cvId = parseInt(resolvedParams.id, 10);

  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    [],
  );

  const [personal, setPersonal] = useState({
    fullName: "",
    title: "",
    phone: "",
    email: "",
    location: "",
    linkedin: "",
  });
  const [profile, setProfile] = useState("");
  const [competency, setCompetencies] = useState([""]);
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: generateId(), company: "", role: "", period: "", details: "" },
  ]);
  const [education, setEducation] = useState<Education[]>([
    { id: generateId(), institution: "", qualification: "", period: "" },
  ]);
  const [certificate, setCertificate] = useState<Certificate[]>([
    { id: generateId(), name: "", date: "" },
  ]);
  const [skill, setSkills] = useState([""]);
  const [reference, setReference] = useState<Reference[]>([
    { id: generateId(), name: "", company: "", role: "", email: "", phone: "" },
  ]);
  const [additionalInfo, setAdditionalInfo] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [templateSettings, setTemplateSettings] =
    useState<TemplateSettings | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const snapshotDoneRef = useRef(false);

  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, unknown>>(
    {},
  );
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [readyOverride, setReadyOverride] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadCV = useCallback(async () => {
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
        setCompetencies(cv.competency?.length > 0 ? cv.competency : [""]);
        setExperiences(
          cv.experiences?.length > 0
            ? cv.experiences.map(
                (e: {
                  company: string;
                  role: string;
                  period: string;
                  details: string;
                }) => ({ ...e, id: generateId() }),
              )
            : [
                {
                  id: generateId(),
                  company: "",
                  role: "",
                  period: "",
                  details: "",
                },
              ],
        );
        setEducation(
          cv.education?.length > 0
            ? cv.education.map(
                (e: {
                  institution: string;
                  qualification: string;
                  period: string;
                }) => ({ ...e, id: generateId() }),
              )
            : [
                {
                  id: generateId(),
                  institution: "",
                  qualification: "",
                  period: "",
                },
              ],
        );
        setCertificate(
          cv.certificate?.length > 0
            ? cv.certificate.map((c: { name: string; date: string }) => ({
                ...c,
                id: generateId(),
              }))
            : [{ id: generateId(), name: "", date: "" }],
        );
        setSkills(cv.skill?.length > 0 ? cv.skill : [""]);
        setReference(
          cv.reference?.length > 0
            ? cv.reference.map(
                (r: {
                  name: string;
                  company: string;
                  role: string;
                  email: string;
                  phone: string;
                }) => ({ ...r, id: generateId() }),
              )
            : [
                {
                  id: generateId(),
                  name: "",
                  company: "",
                  role: "",
                  email: "",
                  phone: "",
                },
              ],
        );
        setAdditionalInfo(
          cv.additionalInfo?.length > 0 ? cv.additionalInfo : [""],
        );

        if (cv.template_settings) {
          setTemplateSettings(cv.template_settings);
        }
        setReadyOverride(!!cv.ready_override);
        setPhotoUrl(`/api/photo/${cvId}`);
      }
    } catch (err) {
      console.error("Failed to load CV:", err);
    } finally {
      setLoading(false);
    }
  }, [cvId, generateId]);

  useEffect(() => {
    loadCV();
  }, [loadCV]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" ||
        (e.metaKey && e.key === "k") ||
        (e.ctrlKey && e.key === "k")
      ) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSave = async (data: Record<string, unknown>) => {
    await fetch(`/api/cv/${cvId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const cvData = {
    personal,
    profile,
    competency,
    experiences,
    education,
    certificate,
    skill,
    reference,
    additionalInfo,
  };
  const { status } = useAutoSave({
    data: cvData as unknown as Record<string, unknown>,
    onSave: handleSave,
    enabled: !loading,
  });

  const handleTailorApply = (update: TailorApplyUpdate) => {
    if (!snapshotDoneRef.current) {
      fetch(`/api/cv/${cvId}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cvData),
      });
      snapshotDoneRef.current = true;
    }
    if (update.profile !== undefined) setProfile(update.profile);
    if (update.skill !== undefined) setSkills(update.skill);
    if (update.competency !== undefined) setCompetencies(update.competency);
    const experiences = update.experiences;
    if (experiences && experiences.length > 0) {
      setExperiences((prev) => applyExperienceUpdates(prev, experiences));
    }
    if (update.profile !== undefined) setHighlightKey("profile");
    if (update.skill !== undefined) setHighlightKey("skill");
    if (update.competency !== undefined) setHighlightKey("competency");
    if (update.experiences?.length) setHighlightKey("experiences");
    setTimeout(() => setHighlightKey(null), 1600);
  };

  const handleRestore = (restored: unknown) => {
    const d = restored as {
      personal?: {
        fullName?: string;
        title?: string;
        phone?: string;
        email?: string;
        location?: string;
        linkedin?: string;
      };
      profile?: string;
      competency?: string[];
      experiences?: Array<{
        company: string;
        role: string;
        period: string;
        details: string;
      }>;
      education?: Array<{
        institution: string;
        qualification: string;
        period: string;
      }>;
      certificate?: Array<{ name: string; date: string }>;
      skill?: string[];
      reference?: Array<{
        name: string;
        company: string;
        role: string;
        email: string;
        phone: string;
      }>;
      additionalInfo?: string[];
    };
    const p = d.personal || {};
    setPersonal({
      fullName: p.fullName || "",
      title: p.title || "",
      phone: p.phone || "",
      email: p.email || "",
      location: p.location || "",
      linkedin: p.linkedin || "",
    });
    setProfile(d.profile || "");
    setCompetencies(d.competency?.length ? d.competency : [""]);
    setExperiences(
      d.experiences?.length
        ? d.experiences.map((e) => ({ ...e, id: generateId() }))
        : [
            {
              id: generateId(),
              company: "",
              role: "",
              period: "",
              details: "",
            },
          ],
    );
    setEducation(
      d.education?.length
        ? d.education.map((e) => ({ ...e, id: generateId() }))
        : [
            {
              id: generateId(),
              institution: "",
              qualification: "",
              period: "",
            },
          ],
    );
    setCertificate(
      d.certificate?.length
        ? d.certificate.map((c) => ({ ...c, id: generateId() }))
        : [{ id: generateId(), name: "", date: "" }],
    );
    setSkills(d.skill?.length ? d.skill : [""]);
    setReference(
      d.reference?.length
        ? d.reference.map((r) => ({ ...r, id: generateId() }))
        : [
            {
              id: generateId(),
              name: "",
              company: "",
              role: "",
              email: "",
              phone: "",
            },
          ],
    );
    setAdditionalInfo(d.additionalInfo?.length ? d.additionalInfo : [""]);
    setHistoryOpen(false);
    snapshotDoneRef.current = false;
  };

  const updatePersonal = (field: string, value: string) =>
    setPersonal((p) => ({ ...p, [field]: value }));
  const addExperience = () =>
    setExperiences((e) => [
      ...e,
      { id: generateId(), company: "", role: "", period: "", details: "" },
    ]);
  const updateExperience = (
    id: string | number,
    field: string,
    value: string,
  ) =>
    setExperiences((e) =>
      e.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  const removeExperience = (id: string | number) =>
    setExperiences((e) => e.filter((item) => item.id !== id));
  const addEducation = () =>
    setEducation((ed) => [
      ...ed,
      { id: generateId(), institution: "", qualification: "", period: "" },
    ]);
  const updateEducation = (id: string | number, field: string, value: string) =>
    setEducation((ed) =>
      ed.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  const removeEducation = (id: string | number) =>
    setEducation((ed) => ed.filter((item) => item.id !== id));
  const addCertificate = () =>
    setCertificate((cert) => [
      ...cert,
      { id: generateId(), name: "", date: "" },
    ]);
  const updateCertificate = (
    id: string | number,
    field: string,
    value: string,
  ) =>
    setCertificate((cert) =>
      cert.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  const removeCertificate = (id: string | number) =>
    setCertificate((cert) => cert.filter((item) => item.id !== id));
  const addSkill = () => setSkills((s) => [...s, ""]);
  const updateSkill = (index: number, value: string) => {
    const s = [...skill];
    s[index] = value;
    setSkills(s);
  };
  const removeSkill = (i: number) =>
    setSkills((s) => s.filter((_, idx) => idx !== i));
  const addReference = () =>
    setReference((ref) => [
      ...ref,
      {
        id: generateId(),
        name: "",
        company: "",
        role: "",
        email: "",
        phone: "",
      },
    ]);
  const updateReference = (id: string | number, field: string, value: string) =>
    setReference((ref) =>
      ref.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  const removeReference = (id: string | number) =>
    setReference((ref) => ref.filter((item) => item.id !== id));
  const addAdditionalInfo = () => setAdditionalInfo((info) => [...info, ""]);
  const updateAdditionalInfo = (idx: number, value: string) => {
    const info = [...additionalInfo];
    info[idx] = value;
    setAdditionalInfo(info);
  };
  const removeAdditionalInfo = (i: number) =>
    setAdditionalInfo((info) => info.filter((_, idx) => idx !== i));
  const addCompetency = () => setCompetencies((c) => [...c, ""]);
  const updateCompetency = (index: number, value: string) => {
    const c = [...competency];
    c[index] = value;
    setCompetencies(c);
  };
  const removeCompetency = (i: number) =>
    setCompetencies((c) => c.filter((_, idx) => idx !== i));

  const exportOptions = {
    templateId: (templateSettings?.template || "classic") as TemplateId,
    themeId: templateSettings?.theme,
    fontPairId: templateSettings?.fontPair,
    photoUrl,
  };

  const handleExportToPdf = () => {
    exportCV("pdf", {
      data: {
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
      ...exportOptions,
    });
  };

  const handleExportToDocx = () => {
    exportCV("docx", {
      data: {
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
      ...exportOptions,
    });
  };

  const openSectionEditor = useCallback(
    (key: SectionKey) => {
      const snapshot: Record<string, unknown> = {
        personal,
        profile,
        competency,
        experiences,
        education,
        certificate,
        skill,
        reference,
        additionalInfo,
      };
      setEditingValues(snapshot);
      setEditingSection(key);
      setHighlightKey(key);
    },
    [
      personal,
      profile,
      competency,
      experiences,
      education,
      certificate,
      skill,
      reference,
      additionalInfo,
    ],
  );

  const commitSectionEditor = () => {
    if (!editingSection) return;
    const v = editingValues;
    if (editingSection === "personal") setPersonal(v.personal as PersonalInfo);
    else if (editingSection === "profile") setProfile(v.profile as string);
    else if (editingSection === "competency")
      setCompetencies(v.competency as string[]);
    else if (editingSection === "experiences")
      setExperiences(v.experiences as Experience[]);
    else if (editingSection === "education")
      setEducation(v.education as Education[]);
    else if (editingSection === "certificate")
      setCertificate(v.certificate as Certificate[]);
    else if (editingSection === "skill") setSkills(v.skill as string[]);
    else if (editingSection === "reference")
      setReference(v.reference as Reference[]);
    else if (editingSection === "additionalInfo")
      setAdditionalInfo(v.additionalInfo as string[]);
    setEditingSection(null);
    setHighlightKey(null);
  };

  const sectionEditorBody = (key: SectionKey) => {
    const v = editingValues;
    switch (key) {
      case "personal":
        return (
          <div className="space-y-4">
            <UploadPhoto cvId={cvId} onUploadComplete={setPhotoUrl} />
            <PersonalInfoForm
              personal={v.personal as PersonalInfo}
              updatePersonal={(f, val) =>
                setEditingValues((e) => ({
                  ...e,
                  personal: { ...(e.personal as PersonalInfo), [f]: val },
                }))
              }
            />
          </div>
        );
      case "profile":
        return (
          <ProfileForm
            profile={v.profile as string}
            setProfile={(val) =>
              setEditingValues((e) => ({ ...e, profile: val }))
            }
          />
        );
      case "competency":
        return (
          <CompetenciesForm
            competency={v.competency as string[]}
            addCompetency={() =>
              setEditingValues((e) => ({
                ...e,
                competency: [...(e.competency as string[]), ""],
              }))
            }
            updateCompetency={(idx, val) =>
              setEditingValues((e) => ({
                ...e,
                competency: (e.competency as string[]).map((s, i) =>
                  i === idx ? val : s,
                ),
              }))
            }
            removeCompetency={(idx) =>
              setEditingValues((e) => ({
                ...e,
                competency: (e.competency as string[]).filter(
                  (_, i) => i !== idx,
                ),
              }))
            }
          />
        );
      case "experiences":
        return (
          <ExperienceForm
            experiences={v.experiences as Experience[]}
            addExperience={() =>
              setEditingValues((e) => ({
                ...e,
                experiences: [
                  ...(e.experiences as Experience[]),
                  {
                    id: generateId(),
                    company: "",
                    role: "",
                    period: "",
                    details: "",
                  },
                ],
              }))
            }
            updateExperience={(id, field, val) =>
              setEditingValues((e) => ({
                ...e,
                experiences: (e.experiences as Experience[]).map((x) =>
                  x.id === id ? { ...x, [field]: val } : x,
                ),
              }))
            }
            removeExperience={(id) =>
              setEditingValues((e) => ({
                ...e,
                experiences: (e.experiences as Experience[]).filter(
                  (x) => x.id !== id,
                ),
              }))
            }
          />
        );
      case "education":
        return (
          <EducationForm
            education={v.education as Education[]}
            addEducation={() =>
              setEditingValues((e) => ({
                ...e,
                education: [
                  ...(e.education as Education[]),
                  {
                    id: generateId(),
                    institution: "",
                    qualification: "",
                    period: "",
                  },
                ],
              }))
            }
            updateEducation={(id, field, val) =>
              setEditingValues((e) => ({
                ...e,
                education: (e.education as Education[]).map((x) =>
                  x.id === id ? { ...x, [field]: val } : x,
                ),
              }))
            }
            removeEducation={(id) =>
              setEditingValues((e) => ({
                ...e,
                education: (e.education as Education[]).filter(
                  (x) => x.id !== id,
                ),
              }))
            }
          />
        );
      case "certificate":
        return (
          <CertificatesForm
            certificate={v.certificate as Certificate[]}
            addCertificate={() =>
              setEditingValues((e) => ({
                ...e,
                certificate: [
                  ...(e.certificate as Certificate[]),
                  { id: generateId(), name: "", date: "" },
                ],
              }))
            }
            updateCertificate={(id, field, val) =>
              setEditingValues((e) => ({
                ...e,
                certificate: (e.certificate as Certificate[]).map((x) =>
                  x.id === id ? { ...x, [field]: val } : x,
                ),
              }))
            }
            removeCertificate={(id) =>
              setEditingValues((e) => ({
                ...e,
                certificate: (e.certificate as Certificate[]).filter(
                  (x) => x.id !== id,
                ),
              }))
            }
          />
        );
      case "skill":
        return (
          <SkillsForm
            skill={v.skill as string[]}
            addSkill={() =>
              setEditingValues((e) => ({
                ...e,
                skill: [...(e.skill as string[]), ""],
              }))
            }
            updateSkill={(idx, val) =>
              setEditingValues((e) => ({
                ...e,
                skill: (e.skill as string[]).map((s, i) =>
                  i === idx ? val : s,
                ),
              }))
            }
            removeSkill={(idx) =>
              setEditingValues((e) => ({
                ...e,
                skill: (e.skill as string[]).filter((_, i) => i !== idx),
              }))
            }
          />
        );
      case "reference":
        return (
          <ReferencesForm
            reference={v.reference as Reference[]}
            addReference={() =>
              setEditingValues((e) => ({
                ...e,
                reference: [
                  ...(e.reference as Reference[]),
                  {
                    id: generateId(),
                    name: "",
                    company: "",
                    role: "",
                    email: "",
                    phone: "",
                  },
                ],
              }))
            }
            updateReference={(id, field, val) =>
              setEditingValues((e) => ({
                ...e,
                reference: (e.reference as Reference[]).map((x) =>
                  x.id === id ? { ...x, [field]: val } : x,
                ),
              }))
            }
            removeReference={(id) =>
              setEditingValues((e) => ({
                ...e,
                reference: (e.reference as Reference[]).filter(
                  (x) => x.id !== id,
                ),
              }))
            }
          />
        );
      case "additionalInfo":
        return (
          <AdditionalInfoForm
            additionalInfo={v.additionalInfo as string[]}
            addAdditionalInfo={() =>
              setEditingValues((e) => ({
                ...e,
                additionalInfo: [...(e.additionalInfo as string[]), ""],
              }))
            }
            updateAdditionalInfo={(idx, val) =>
              setEditingValues((e) => ({
                ...e,
                additionalInfo: (e.additionalInfo as string[]).map((s, i) =>
                  i === idx ? val : s,
                ),
              }))
            }
            removeAdditionalInfo={(idx) =>
              setEditingValues((e) => ({
                ...e,
                additionalInfo: (e.additionalInfo as string[]).filter(
                  (_, i) => i !== idx,
                ),
              }))
            }
          />
        );
    }
  };

  const applyTemplateSettings = async (patch: Partial<TemplateSettings>) => {
    const next: TemplateSettings = {
      template: (patch.template ??
        templateSettings?.template ??
        "classic") as TemplateId,
      theme: patch.theme ?? templateSettings?.theme ?? "default-blue",
      fontPair: patch.fontPair ?? templateSettings?.fontPair ?? "default",
    };
    setTemplateSettings(next);
    await fetch(`/api/cv/${cvId}/template`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  const toggleReady = async () => {
    await fetch(`/api/cv/${cvId}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ready: !readyOverride }),
    });
    setReadyOverride(!readyOverride);
  };

  const inspectorSections = cvReadiness(cvData).sections;

  const PageNav = ({
    currentPage,
    totalPages,
    onPrev,
    onNext,
  }: {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
  }) => (
    <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-hairline bg-surface px-4 py-2 shadow-sm">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage === 0}
        aria-label="Previous page"
        className="h-8 w-8 rounded-full bg-surface text-ink hover:bg-desk disabled:cursor-not-allowed disabled:opacity-30"
      >
        &#8249;
      </button>
      <span className="min-w-[110px] text-center text-sm font-medium text-ink">
        Page {currentPage + 1} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentPage >= totalPages - 1}
        aria-label="Next page"
        className="h-8 w-8 rounded-full bg-surface text-ink hover:bg-desk disabled:cursor-not-allowed disabled:opacity-30"
      >
        &#8250;
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center animate-pulse-subtle text-[#8a8a8a]">
        Loading...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-desk">
      <EditorialChrome
        name={personal.fullName || "Untitled CV"}
        onChangeName={(value) =>
          setPersonal((p) => ({ ...p, fullName: value }))
        }
        saveStatus={status}
        cvId={cvId}
        onHistory={() => setHistoryOpen(true)}
        onExportPdf={handleExportToPdf}
        onExportDocx={handleExportToDocx}
        onToggleReady={toggleReady}
        isReadySet={readyOverride}
      />
      <div className="flex flex-1 justify-center gap-0 overflow-auto p-8 lg:justify-between">
        <div className="w-full max-w-[794px]">
          <div className="mx-auto rounded-md bg-white p-4 shadow-sm">
            <CVPreview
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
              onSectionClick={(key) => openSectionEditor(key as SectionKey)}
              highlightKey={highlightKey}
            />
          </div>
          <PageNav
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(0, p - 1))}
            onNext={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
          />
        </div>
        <InspectorRail
          sections={inspectorSections}
          templateId={(templateSettings?.template ?? "classic") as TemplateId}
          themeId={templateSettings?.theme ?? "default-blue"}
          fontPairId={templateSettings?.fontPair ?? "default"}
          onTemplateChange={(t) => applyTemplateSettings({ template: t })}
          onThemeChange={(t) => applyTemplateSettings({ theme: t })}
          onFontPairChange={(t) => applyTemplateSettings({ fontPair: t })}
          onEditSection={openSectionEditor}
          tailorSlot={
            <TailorPanel
              cv={cvData as Record<string, unknown>}
              onApply={handleTailorApply}
            />
          }
        />
      </div>
      <CommandMenu
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onJump={(key) => openSectionEditor(key as SectionKey)}
        onExportPdf={handleExportToPdf}
        onExportDocx={handleExportToDocx}
        onBack={() => router.push("/cvs")}
      />
      {historyOpen && (
        <VersionHistory
          cvId={cvId}
          onRestore={handleRestore}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {editingSection && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-6">
          <div className="w-full max-w-2xl">
            <SectionEditor
              title={SECTION_LABELS[editingSection]}
              onDone={commitSectionEditor}
              onCancel={() => setEditingSection(null)}
            >
              {sectionEditorBody(editingSection)}
            </SectionEditor>
          </div>
        </div>
      )}
    </main>
  );
}
