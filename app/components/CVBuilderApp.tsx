// app/components/CVBuilderApp.tsx - Final Version with CV Manager

import { ArrowLeft } from "lucide-react";
import React, { useRef, useState } from "react";
import { useNotification } from "../hooks/useNotification";
import Chat from "./ai/Chat";
import CVBuilderForm from "./CVBuilderForm";
import CVListManager from "./CVListManager";
import CVPreviewWrapper, {
  type CVPreviewWrapperHandle,
} from "./CVPreviewWrapper";
import { exportToDocx, exportToPdf } from "./modules/exportModule";
import NotificationModal from "./NotificationModal";
import Page from "./page";

export default function CVBuilderApp() {
  const [showCVList, setShowCVList] = useState(false);
  const [testAi, setTestAi] = useState(false);

  const handleFunctionSwitch = (component: any) => {
    if (component === "ai") {
      setTestAi(!testAi);
    } else {
      setShowCVList(!showCVList);
      setTestAi(false);
    }
  };

  console.log("🟡 CVBuilderApp rendered, showCVList:", showCVList);

  console.log("🟡 CVBuilderApp rendered, testAI:", testAi);

  const [personal, setPersonal] = useState({
    fullName: "",
    title: "",
    phone: "",
    email: "",
    location: "",
    linkedin: "",
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const [profile, setProfile] = useState("");
  const [competency, setCompetencies] = useState([""]);
  const [experiences, setExperiences] = useState([
    { id: generateId(), company: "", role: "", period: "", details: "" },
  ]);
  const [education, setEducation] = useState([
    { id: generateId(), institution: "", qualification: "", period: "" },
  ]);
  const [certificate, setCertificate] = useState([
    { id: generateId(), name: "", date: "" },
  ]);
  const [skill, setSkills] = useState([""]);
  const [reference, setReference] = useState([
    { id: generateId(), name: "", company: "", role: "", email: "", phone: "" },
  ]);

  const [additionalInfo, setAdditionalInfo] = useState([""]);

  const [currentCvId, setCurrentCvId] = useState<string | number | null>(null);
  const {
    notification,
    closeNotification,
    showSuccess,
    showError,
    showInfo,
    showSaving,
    showWarning,
  } = useNotification();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const previewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<CVPreviewWrapperHandle>(null);

  /***************************************************/
  /******************** Handlers *********************/
  /***************************************************/
  // Personal Information handlers
  const updatePersonal = (field: any, value: any) =>
    setPersonal((p) => ({ ...p, [field]: value }));

  // Competencies handlers
  const addCompetency = () => setCompetencies((s) => [...s, ""]);
  const updateCompetency = (index: any, value: any) => {
    const comp = [...competency];
    comp[index] = value;
    setCompetencies(comp);
  };
  const removeCompetency = (i: number) =>
    setCompetencies((s) => s.filter((_, idx) => idx !== i));

  // Experiences handlers
  const addExperience = () =>
    setExperiences((e) => [
      ...e,
      { id: generateId(), company: "", role: "", period: "", details: "" },
    ]);
  const updateExperience = (
    id: string | number,
    field: keyof (typeof experiences)[0],
    value: string,
  ) =>
    setExperiences((e) =>
      e.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
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
      ed.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  const removeEducation = (id: string | number) =>
    setEducation((ed) => ed.filter((item) => item.id !== id));

  // Education handlers
  const addCertificate = () =>
    setCertificate((cert) => [
      ...cert,
      { id: generateId(), name: "", date: "" },
    ]);
  const updateCertificate = (id: string | number, field: any, value: any) =>
    setCertificate((cert) =>
      cert.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  const removeCertificate = (id: string | number) =>
    setCertificate((cert) => cert.filter((item) => item.id !== id));

  // Skills handlers
  const addSkill = () => setSkills((s) => [...s, ""]);
  const updateSkill = (index: any, value: any) => {
    const s = [...skill];
    s[index] = value;
    setSkills(s);
  };
  const removeSkill = (i: number) =>
    setSkills((s) => s.filter((_, idx) => idx !== i));

  // References handlers
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
  const updateReference = (id: string | number, field: any, value: any) => {
    setReference((ref) =>
      ref.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };
  const removeReference = (id: string | number) =>
    setReference((ref) => ref.filter((item) => item.id !== id));

  // Additional Information handlers
  const addAdditionalInfo = () => setAdditionalInfo((info) => [...info, ""]);
  const updateAdditionalInfo = (idx: any, value: any) => {
    const info = [...additionalInfo];
    info[idx] = value;
    setAdditionalInfo(info);
  };
  const removeAdditionalInfo = (i: number) =>
    setAdditionalInfo((info) => info.filter((_, idx) => idx !== i));

  // Create new CV (clear form)
  const handleNewCV = () => {
    if (
      confirm(
        "Are you sure you want to create a new CV? Any unsaved changes will be lost.",
      )
    ) {
      setPersonal({
        fullName: "",
        title: "",
        phone: "",
        email: "",
        location: "",
        linkedin: "",
      });
      setProfile("");
      setCompetencies([""]);
      setExperiences([
        { id: generateId(), company: "", role: "", period: "", details: "" },
      ]);
      setEducation([
        { id: generateId(), institution: "", qualification: "", period: "" },
      ]);
      setCertificate([{ id: generateId(), name: "", date: "" }]);
      setSkills([""]);
      setReference([
        {
          id: generateId(),
          name: "",
          company: "",
          role: "",
          email: "",
          phone: "",
        },
      ]);
      setAdditionalInfo([""]);
      setCurrentCvId(null);
      setSaveStatus("idle");
    }
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    showSaving("Saving...", "Hold on while we save your CV");
    setSaveStatus("saving");
    try {
      const cvData = {
        personal,
        profile,
        competency,
        experiences: experiences.map(({ id, ...rest }) => rest),
        education: education.map(({ id, ...rest }) => rest),
        skill,
        certificate: certificate.map(({ id, ...rest }) => rest),
        reference: reference.map(({ id, ...rest }) => rest),
        additionalInfo,
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

      // Check if response status is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response format: expected JSON");
      }

      const result = await response.json();

      // Validate required fields in response
      if (!result.success || !result.cvId) {
        throw new Error(
          result.message || "Invalid response: missing required fields",
        );
      }

      setCurrentCvId(result.cvId);
      showSuccess("Success!", "CV saved successfully");
      setTimeout(() => setSaveStatus("idle"), 300);
    } catch (error) {
      console.error("Error saving CV:", error);
      setSaveStatus("error");
      showWarning("warning!", "Failed to save CV. Please try again.");
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
        setCompetencies(cv.competency.length > 0 ? cv.competency : [""]);
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
              ],
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
              ],
        );
        setCertificate(
          cv.certificate.length > 0
            ? cv.certificate.map((cert: any) => ({ ...cert, id: generateId() }))
            : [
                {
                  id: generateId(),
                  name: "",
                  date: "",
                },
              ],
        );
        setSkills(cv.skill.length > 0 ? cv.skill : [""]);
        setReference(
          cv.reference.length > 0
            ? cv.reference.map((ref: any) => ({ ...ref, id: generateId() }))
            : [
                {
                  id: generateId(),
                  name: "",
                  role: "",
                  company: "",
                  email: "",
                  phone: "",
                },
              ],
        );
        setAdditionalInfo(
          cv.additionalInfo.length > 0 ? cv.additionalInfo : [""],
        );
        setCurrentCvId(cvId);
        setShowCVList(false); // Close the CV list after loading
        showInfo("CV Loaded", "CV loaded successfully from database");
      } else {
        showError("Error", "Failed to load CV from database");
      }
    } catch (error) {
      console.error("Error loading CV:", error);
      showError("Error", "Failed to load CV from database");
    }
  };

  // Export functions
  const handleExportToDocx = () => {
    exportToDocx({
      personal,
      profile,
      competency,
      experiences,
      education,
      certificate,
      skill,
      reference,
      additionalInfo,
    });
  };

  const handleExportToPdf = () => {
    exportToPdf({
      personal,
      profile,
      competency,
      experiences,
      education,
      certificate,
      skill,
      reference,
      additionalInfo,
      previewRef,
    });
  };

  const handlePrintToPdf = () => {
    printRef.current?.print();
  };

  return (
    <div className="min-h-screen bg-gray-400 p-6">
      {/* <button
        className="bg-gray-800 text-white flex hidden items-center justify-center rounded-full size-9 cursor-pointer absolute top-[50%] left-6 hover:bg-gray-900  hover:transform hover:size-11 transition-all duration-300"
        type="submit"
        onClick={() => setShowCVList(!showCVList)}
      >
        <ArrowLeft />
      </button> */}
      {/* Header with actions */}
      <div className="max-w-8xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Spectres | Skill Stack
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Thembi's AI-Powered CV Builder
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleNewCV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              New CV
            </button>
            <button
              onClick={() => handleFunctionSwitch("cvList")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                showCVList
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {showCVList ? "✏️ Edit CV" : "📋 Manage CVs"}
            </button>
            {/* AI Chat feature muted - to be re-enabled later
            <button
              onClick={() => handleFunctionSwitch("ai")}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              TEST AI CHAT
            </button>
            */}
          </div>
        </div>
      </div>
      <div>
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />
      </div>

      <div className="max-w-8xl mx-auto">
        {testAi ? (
          // AI Chat View
          <Page />
        ) : (
          <>
            {showCVList === true && (
              <CVListManager
                onLoadCV={handleLoadFromDatabase}
                currentCvId={currentCvId}
              />
            )}{" "}
            {showCVList === false && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  printToPdf={handlePrintToPdf}
                  saveToDatabase={handleSaveToDatabase}
                  saveStatus={saveStatus}
                  currentCvId={currentCvId}
                />

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
                  previewRef={previewRef}
                  ref={printRef}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
