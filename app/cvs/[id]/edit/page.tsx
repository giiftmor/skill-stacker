// app/cvs/[id]/edit/page.tsx - Edit CV
"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/ui/Header";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import CVBuilderForm from "../../../components/CVBuilderForm";
import CVPreviewWrapper from "../../../components/CVPreviewWrapper";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { TemplateId, TemplateSettings } from "../../../lib/templates/templateDefinitions";
import { exportCV } from "../../../lib/export/exportDispatcher";
import UploadPhoto from "../../../components/ui/UploadPhoto";

export default function EditCVPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const cvId = parseInt(resolvedParams.id, 10);

  const generateId = () => Math.random().toString(36).substr(2, 9);

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
  const [experiences, setExperiences] = useState([{ id: generateId(), company: "", role: "", period: "", details: "" }]);
  const [education, setEducation] = useState([{ id: generateId(), institution: "", qualification: "", period: "" }]);
  const [certificate, setCertificate] = useState([{ id: generateId(), name: "", date: "" }]);
  const [skill, setSkills] = useState([""]);
  const [reference, setReference] = useState([{ id: generateId(), name: "", company: "", role: "", email: "", phone: "" }]);
  const [additionalInfo, setAdditionalInfo] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const previewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<any>(null);

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
        setCompetencies(cv.competency?.length > 0 ? cv.competency : [""]);
        setExperiences(cv.experiences?.length > 0 ? cv.experiences.map((e: any) => ({ ...e, id: generateId() })) : [{ id: generateId(), company: "", role: "", period: "", details: "" }]);
        setEducation(cv.education?.length > 0 ? cv.education.map((e: any) => ({ ...e, id: generateId() })) : [{ id: generateId(), institution: "", qualification: "", period: "" }]);
        setCertificate(cv.certificate?.length > 0 ? cv.certificate.map((c: any) => ({ ...c, id: generateId() })) : [{ id: generateId(), name: "", date: "" }]);
        setSkills(cv.skill?.length > 0 ? cv.skill : [""]);
        setReference(cv.reference?.length > 0 ? cv.reference.map((r: any) => ({ ...r, id: generateId() })) : [{ id: generateId(), name: "", company: "", role: "", email: "", phone: "" }]);
        setAdditionalInfo(cv.additionalInfo?.length > 0 ? cv.additionalInfo : [""]);

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

  const handleSave = async (data: Record<string, unknown>) => {
    await fetch(`/api/cv/${cvId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const cvData = { personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo };
  const { status } = useAutoSave({
    data: cvData as unknown as Record<string, unknown>,
    onSave: handleSave,
    enabled: !loading,
  });

  const updatePersonal = (field: string, value: string) => setPersonal((p) => ({ ...p, [field]: value }));
  const addExperience = () => setExperiences((e) => [...e, { id: generateId(), company: "", role: "", period: "", details: "" }]);
  const updateExperience = (id: string | number, field: string, value: string) => setExperiences((e) => e.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  const removeExperience = (id: string | number) => setExperiences((e) => e.filter((item) => item.id !== id));
  const addEducation = () => setEducation((ed) => [...ed, { id: generateId(), institution: "", qualification: "", period: "" }]);
  const updateEducation = (id: string | number, field: string, value: string) => setEducation((ed) => ed.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  const removeEducation = (id: string | number) => setEducation((ed) => ed.filter((item) => item.id !== id));
  const addCertificate = () => setCertificate((cert) => [...cert, { id: generateId(), name: "", date: "" }]);
  const updateCertificate = (id: string | number, field: string, value: string) => setCertificate((cert) => cert.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  const removeCertificate = (id: string | number) => setCertificate((cert) => cert.filter((item) => item.id !== id));
  const addSkill = () => setSkills((s) => [...s, ""]);
  const updateSkill = (index: number, value: string) => { const s = [...skill]; s[index] = value; setSkills(s); };
  const removeSkill = (i: number) => setSkills((s) => s.filter((_, idx) => idx !== i));
  const addReference = () => setReference((ref) => [...ref, { id: generateId(), name: "", company: "", role: "", email: "", phone: "" }]);
  const updateReference = (id: string | number, field: string, value: string) => setReference((ref) => ref.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  const removeReference = (id: string | number) => setReference((ref) => ref.filter((item) => item.id !== id));
  const addAdditionalInfo = () => setAdditionalInfo((info) => [...info, ""]);
  const updateAdditionalInfo = (idx: number, value: string) => { const info = [...additionalInfo]; info[idx] = value; setAdditionalInfo(info); };
  const removeAdditionalInfo = (i: number) => setAdditionalInfo((info) => info.filter((_, idx) => idx !== i));
  const addCompetency = () => setCompetencies((c) => [...c, ""]);
  const updateCompetency = (index: number, value: string) => { const c = [...competency]; c[index] = value; setCompetencies(c); };
  const removeCompetency = (i: number) => setCompetencies((c) => c.filter((_, idx) => idx !== i));

  const exportOptions = {
    templateId: (templateSettings?.template || "classic") as TemplateId,
    themeId: templateSettings?.theme,
    fontPairId: templateSettings?.fontPair,
    photoUrl,
  };

  const handleExportToPdf = () => {
    exportCV("pdf", {
      data: { personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo },
      ...exportOptions,
    });
  };

  const handleExportToDocx = () => {
    exportCV("docx", {
      data: { personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo },
      ...exportOptions,
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center animate-pulse-subtle text-[#8a8a8a]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header
        title="Edit CV"
        saveStatus={status}
        showSave
        actions={
          <button
            onClick={() => router.push(`/cvs/${cvId}/preview`)}
            className="px-4 py-2 bg-[#d4a853] text-[#0d0d0d] hover:bg-[#b8923e] rounded font-semibold"
          >
            Preview
          </button>
        }
      />
      <Breadcrumb
        items={[
          { label: "My CVs", href: "/cvs" },
          { label: personal.fullName || "Edit CV" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <UploadPhoto cvId={cvId} onUploadComplete={setPhotoUrl} />
            </div>
            <CVBuilderForm
              personal={personal}
              updatePersonal={updatePersonal}
              profile={profile}
              setProfile={setProfile}
              competency={competency}
              updateCompetency={updateCompetency}
              addCompetency={addCompetency}
              removeCompetency={removeCompetency}
              experiences={experiences}
              addExperience={addExperience}
              updateExperience={updateExperience}
              removeExperience={removeExperience}
              education={education}
              addEducation={addEducation}
              updateEducation={updateEducation}
              removeEducation={removeEducation}
              certificate={certificate}
              addCertificate={addCertificate}
              updateCertificate={updateCertificate}
              removeCertificate={removeCertificate}
              skill={skill}
              updateSkill={updateSkill}
              addSkill={addSkill}
              removeSkill={removeSkill}
              reference={reference}
              updateReference={updateReference}
              addReference={addReference}
              removeReference={removeReference}
              additionalInfo={additionalInfo}
              addAdditionalInfo={addAdditionalInfo}
              updateAdditionalInfo={updateAdditionalInfo}
              removeAdditionalInfo={removeAdditionalInfo}
              exportToDocx={handleExportToDocx}
              exportToPdf={handleExportToPdf}
              printToPdf={handleExportToPdf}
              saveToDatabase={() => {}}
              saveStatus="idle"
              currentCvId={cvId}
            />
          </div>
          <div className="lg:col-span-2">
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
              previewRef={previewRef}
              ref={printRef}
            />
          </div>
        </div>
      </main>
</div>
  );
}