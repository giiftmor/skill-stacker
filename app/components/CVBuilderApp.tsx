// Main App Component
import React, { useState, useRef } from "react";
import CVBuilderForm from "./CVBuilderForm";
import CVPreview from "./CVPreview";
import {
  exportToDocx,
  exportToPdf,
  exportToPdfAdvanced,
} from "./modules/exportModule";
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
    id: string,
    field: keyof (typeof experiences)[0],
    value: string
  ) =>
    setExperiences((e) =>
      e.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  const removeExperience = (id: string) =>
    setExperiences((e) => e.filter((item) => item.id !== id));

  // Education handlers
  const addEducation = () =>
    setEducation((ed) => [
      ...ed,
      { id: generateId(), institution: "", qualification: "", period: "" },
    ]);
  const updateEducation = (id: string, field: any, value: any) =>
    setEducation((ed) =>
      ed.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  const removeEducation = (id: string) =>
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

  // Export functions (demo versions)
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
