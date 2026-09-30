"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PersonalInfoForm from "@/app/components/Forms/PersonalInfoForm";
import ProfileForm from "@/app/components/Forms/ProfileForm";
import ExperienceForm from "@/app/components/Forms/ExperienceForm";
import EducationForm from "@/app/components/Forms/EducationForm";
import SkillsForm from "@/app/components/Forms/SkillsForm";
import { cvReadiness } from "@/app/lib/readiness";
import type { TemplateId } from "@/app/lib/templates/templateDefinitions";
import { CaptureStepper, CAPTURE_STEPS, type CaptureStepId } from "./CaptureStepper";
import StepStyle from "./StepStyle";
import { Sparkles, ArrowRight } from "lucide-react";

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function GuidedCapture() {
  const router = useRouter();
  const [step, setStep] = useState<CaptureStepId>("personal");

  const [personal, setPersonal] = useState({
    fullName: "", title: "", phone: "", email: "", location: "", linkedin: "",
  });
  const [profile, setProfile] = useState("");
  const [experiences, setExperiences] = useState([
    { id: generateId(), company: "", role: "", period: "", details: "" },
  ]);
  const [education, setEducation] = useState([
    { id: generateId(), institution: "", qualification: "", period: "" },
  ]);
  const [skill, setSkill] = useState<string[]>([""]);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classic");
  const [selectedTheme, setSelectedTheme] = useState("default-blue");
  const [selectedFontPair, setSelectedFontPair] = useState("default");

  const [suggestState, setSuggestState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const updatePersonal = (field: string, value: string) =>
    setPersonal((p) => ({ ...p, [field]: value }));
  const addExperience = () =>
    setExperiences((e) => [...e, { id: generateId(), company: "", role: "", period: "", details: "" }]);
  const updateExperience = (id: string | number, field: string, value: string) =>
    setExperiences((e) => e.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  const removeExperience = (id: string | number) =>
    setExperiences((e) => e.filter((x) => x.id !== id));
  const addEducation = () =>
    setEducation((e) => [...e, { id: generateId(), institution: "", qualification: "", period: "" }]);
  const updateEducation = (id: string | number, field: string, value: string) =>
    setEducation((e) => e.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  const removeEducation = (id: string | number) =>
    setEducation((e) => e.filter((x) => x.id !== id));
  const addSkill = () => setSkill((s) => [...s, ""]);
  const updateSkill = (idx: number, value: string) => setSkill((s) => s.map((v, i) => (i === idx ? value : v)));
  const removeSkill = (idx: number) => setSkill((s) => s.filter((_, i) => i !== idx));

  const percent = cvReadiness({
    personal, profile, competency: [],
    experiences, education, certificate: [], skill, reference: [], additionalInfo: [],
  }).percent;

  const suggestSummary = async () => {
    setSuggestState("loading");
    const sourceText = [
      personal.fullName ? `Name: ${personal.fullName}` : "",
      personal.title ? `Title: ${personal.title}` : "",
      ...experiences.filter((e) => e.company).map((e) => `${e.role} at ${e.company}${e.period ? ` (${e.period})` : ""}`),
    ].filter(Boolean).join(". ");
    const res = await fetch("/api/tailor/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "profile", original: profile, sourceText }),
    });
    const body = await res.json();
    if (body.success) {
      setProfile(body.diff.proposed);
      setSuggestState("done");
    } else {
      setSuggestState("error");
    }
  };

  const createAndOpen = async () => {
    const strip = (items: Array<Record<string, unknown>>) => items.map(({ id: _id, ...rest }) => rest);
    const res = await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personal,
        profile,
        competency: [],
        experiences: strip(experiences),
        education: strip(education),
        certificate: [],
        skill,
        reference: [],
        additionalInfo: [],
        templateSettings: { template: selectedTemplate, theme: selectedTheme, fontPair: selectedFontPair },
      }),
    });
    const body = await res.json();
    if (body.success) router.push(`/cvs/${body.cvId}/edit`);
  };

  return (
    <main className="min-h-screen bg-canvas">
      <CaptureStepper step={step} percent={percent} onNavigate={setStep} />
      <section className="mx-auto mt-6 grid max-w-5xl gap-6 px-6 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-hairline bg-surface p-6">
          <h1 data-testid="capture-title" className="font-[family-name:var(--font-heading)] text-2xl text-ink">
            {CAPTURE_STEPS.find((s) => s.id === step)?.label}
          </h1>
          <div className="mt-4 space-y-5">
            {step === "personal" && (
              <>
                <PersonalInfoForm personal={personal} updatePersonal={updatePersonal} />
                <div className="flex items-start gap-3 rounded-md border border-hairline p-3">
                  <div className="flex-1">
                    <ProfileForm profile={profile} setProfile={setProfile} />
                  </div>
                  <button
                    onClick={suggestSummary}
                    disabled={suggestState === "loading"}
                    className="flex items-center gap-1 rounded-md border border-accent px-3 py-1.5 text-sm text-accent"
                  >
                    <Sparkles size={14} />
                    {suggestState === "loading" ? "Drafting…" : "Suggest a summary"}
                  </button>
                </div>
                {suggestState === "done" && <p className="text-sm text-status-good">Draft added — edit freely, then Continue.</p>}
                {suggestState === "error" && <p className="text-sm text-status-warn">No safe suggestion right now — write it by hand.</p>}
              </>
            )}
            {step === "work" && (
              <ExperienceForm experiences={experiences} addExperience={addExperience} updateExperience={updateExperience} removeExperience={removeExperience} />
            )}
            {step === "education" && (
              <div className="space-y-2">
                <div className="rounded-md border border-hairline p-3">
                  <SkillsForm skill={skill} addSkill={addSkill} updateSkill={updateSkill} removeSkill={removeSkill} />
                </div>
                <EducationForm education={education} addEducation={addEducation} updateEducation={updateEducation} removeEducation={removeEducation} />
              </div>
            )}
            {step === "style" && (
              <StepStyle
                selectedTemplate={selectedTemplate}
                selectedTheme={selectedTheme}
                selectedFontPair={selectedFontPair}
                onTemplateChange={setSelectedTemplate}
                onThemeChange={setSelectedTheme}
                onFontPairChange={setSelectedFontPair}
              />
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                const idx = CAPTURE_STEPS.findIndex((s) => s.id === step);
                setStep(CAPTURE_STEPS[Math.max(0, idx - 1)].id);
              }}
              disabled={step === "personal"}
              className="rounded-md border border-hairline px-4 py-2 text-sm text-muted disabled:opacity-40"
            >
              Back
            </button>
            {step === "style" ? (
              <button onClick={createAndOpen} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-surface">
                Open in Editor <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => {
                  const idx = CAPTURE_STEPS.findIndex((s) => s.id === step);
                  setStep(CAPTURE_STEPS[idx + 1].id);
                }}
                className="rounded-md bg-accent px-4 py-2 text-surface"
              >
                Continue
              </button>
            )}
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-8 max-h-[80vh] overflow-auto rounded-lg border border-hairline bg-surface p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Live draft</p>
            <MiniPreview data={{ personal, profile, competency: [], experiences, education, certificate: [], skill, reference: [], additionalInfo: [] }} templateSettings={{ template: selectedTemplate, theme: selectedTheme, fontPair: selectedFontPair }} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function MiniPreview({
  data, templateSettings,
}: {
  data: Record<string, unknown>;
  templateSettings: { template: TemplateId; theme: string; fontPair: string };
}) {
  const CVPreviewModule = require("@/app/components/CVPreview");
  const CVPreview = (CVPreviewModule.default ?? CVPreviewModule) as typeof import("@/app/components/CVPreview").default;
  return (
    <div className="pointer-events-none overflow-hidden rounded-sm border border-hairline" style={{ transform: "scale(0.58)", transformOrigin: "top left" }}>
      <CVPreview
        personal={data.personal as never}
        profile={data.profile as string}
        competency={data.competency as string[]}
        experiences={data.experiences as never[]}
        education={data.education as never[]}
        certificate={data.certificate as never[]}
        skill={data.skill as string[]}
        reference={data.reference as never[]}
        additionalInfo={data.additionalInfo as string[]}
        templateId={templateSettings.template}
        themeId={templateSettings.theme}
        fontPairId={templateSettings.fontPair}
      />
    </div>
  );
}