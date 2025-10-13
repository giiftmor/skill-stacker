// app/components/CVBuilderApp.tsx - Final Version with CV Manager
import React, { useState, useRef } from "react";
import CVBuilderForm from "./CVBuilderForm";
import CVPreview from "./CVPreview";
import CVListManager from "./CVListManager";
import { exportToDocx, exportToPdf } from "./modules/exportModule";

export default function CVBuilderApp() {
  const [personal, setPersonal] = useState({
    fullName: "",
    title: "",
    phone: "",
    email: "",
    location: "",
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const [profile, setProfile] = useState("");
  const [skills, setSkills] = useState([""]);
  const [experiences, setExperiences] = useState([
    { id: generateId(), company: "", role: "", period: "", details: "" },
  ]);
  const [education, setEducation] = useState([
    { id: generateId(), institution: "", qualification: "", period: "" },
  ]);
  const [references, setReferences] = useState([""]);
  const [currentCvId, setCurrentCvId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [showCVList, setShowCVList] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Handlers
  const updatePersonal = (field: any, value: any) =>
    setPersonal((p) => ({ ...p, [field]: value }));

  // Skills handlers
  const updateSkill = (index: any, value: any) => {
    const s = [...skills];
    s[index] = value;
    setSkills(s);
  };
  const addSkill = () => setSkills((s) => [...s, ""]);
  const removeSkill = (i: number) =>
    setSkills((s) => s.filter((_, idx) => idx !== i));

  // Experiences handlers
  const addExperience = () =>
    setExperiences((e) => [
      ...e,
      { id: generateId(), company: "", role: "", period: "", details: "" },
    ]);
  const updateExperience = (
    id: string | number,
    field: keyof (typeof experiences)[0],
    value: string
  ) =>
    setExperiences((e) =>
      e.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  const removeExperience = (id: string | number) =>
    setExperiences((e) => e.filter((item) => item.id !== id));

  // Education handlers
  const addEducation = () =>
    setEducation((ed) => [
      ...ed,
      { id: generateId(), institution: "", qualification: "", period: "" },
    ]);
  const updateEducation = (id: string | number, field: any, value: any) =>
    setEducation((ed) =>
      ed.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  const removeEducation = (id: string | number) =>
    setEducation((ed) => ed.filter((item) => item.id !== id));

  // References handlers
  const updateReference = (index: number, value: string) => {
    const r = [...references];
    r[index] = value;
    setReferences(r);
  };
  const addReference = () => setReferences((r) => [...r, ""]);
  const removeReference = (i: number) =>
    setReferences((r) => r.filter((_, idx) => idx !== i));

  // Create new CV (clear form)
  const handleNewCV = () => {
    if (
      confirm(
        "Are you sure you want to create a new CV? Any unsaved changes will be lost."
      )
    ) {
      setPersonal({
        fullName: "",
        title: "",
        phone: "",
        email: "",
        location: "",
      });
      setProfile("");
      setSkills([""]);
      setExperiences([
        { id: generateId(), company: "", role: "", period: "", details: "" },
      ]);
      setEducation([
        { id: generateId(), institution: "", qualification: "", period: "" },
      ]);
      setReferences([""]);
      setCurrentCvId(null);
      setSaveStatus("idle");
    }
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    setSaveStatus("saving");

    try {
      const cvData = {
        personal,
        profile,
        skills,
        experiences: experiences.map(({ id, ...rest }) => rest),
        education: education.map(({ id, ...rest }) => rest),
        references,
      };

      const url = currentCvId ? `/api/cv/${currentCvId}` : "/api/cv";
      const method = currentCvId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cvData),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentCvId(result.cvId);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        alert(`Failed to save CV: ${result.message}`);
      }
    } catch (error) {
      console.error("Error saving CV:", error);
      setSaveStatus("error");
      alert("Failed to save CV. Please try again.");
    }
  };

  // Load CV from database
  const handleLoadFromDatabase = async (cvId: number) => {
    try {
      const response = await fetch(`/api/cv/${cvId}`);
      const result = await response.json();

      if (result.success && result.cv) {
        const cv = result.cv;
        setPersonal(cv.personal);
        setProfile(cv.profile);
        setSkills(cv.skills.length > 0 ? cv.skills : [""]);
        setExperiences(
          cv.experiences.length > 0
            ? cv.experiences.map((exp: any) => ({ ...exp, id: generateId() }))
            : [
                {
                  id: generateId(),
                  company: "",
                  role: "",
                  period: "",
                  details: "",
                },
              ]
        );
        setEducation(
          cv.education.length > 0
            ? cv.education.map((edu: any) => ({ ...edu, id: generateId() }))
            : [
                {
                  id: generateId(),
                  institution: "",
                  qualification: "",
                  period: "",
                },
              ]
        );
        setReferences(cv.references.length > 0 ? cv.references : [""]);
        setCurrentCvId(cvId);
        setShowCVList(false); // Close the CV list after loading
        setSaveStatus("idle");
      } else {
        alert(`Failed to load CV: ${result.message}`);
      }
    } catch (error) {
      console.error("Error loading CV:", error);
      alert("Failed to load CV. Please try again.");
    }
  };

  // Export functions
  const handleExportToDocx = () => {
    exportToDocx({
      personal,
      profile,
      skills,
      experiences,
      education,
      references,
    });
  };

  const handleExportToPdf = () => {
    exportToPdf({
      personal,
      profile,
      skills,
      experiences,
      education,
      references,
      previewRef,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with actions */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Spectres | Skill Stack
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Professional CV Builder
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleNewCV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              ➕ New CV
            </button>
            <button
              onClick={() => setShowCVList(!showCVList)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                showCVList
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {showCVList ? "✏️ Edit CV" : "📋 Manage CVs"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {showCVList ? (
          // CV List View
          <CVListManager
            onLoadCV={handleLoadFromDatabase}
            currentCvId={currentCvId}
          />
        ) : (
          // Editor View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CVBuilderForm
              personal={personal}
              updatePersonal={updatePersonal}
              profile={profile}
              setProfile={setProfile}
              skills={skills}
              updateSkill={updateSkill}
              addSkill={addSkill}
              removeSkill={removeSkill}
              experiences={experiences}
              addExperience={addExperience}
              updateExperience={updateExperience}
              removeExperience={removeExperience}
              education={education}
              addEducation={addEducation}
              updateEducation={updateEducation}
              removeEducation={removeEducation}
              references={references}
              updateReference={updateReference}
              addReference={addReference}
              removeReference={removeReference}
              exportToDocx={handleExportToDocx}
              exportToPdf={handleExportToPdf}
              saveToDatabase={handleSaveToDatabase}
              saveStatus={saveStatus}
              currentCvId={currentCvId}
            />

            <CVPreview
              personal={personal}
              profile={profile}
              skills={skills}
              experiences={experiences}
              education={education}
              references={references}
              previewRef={previewRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}
