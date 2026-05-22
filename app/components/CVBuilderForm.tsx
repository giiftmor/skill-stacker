// app/components/CVBuilderForm.tsx - With Smooth Accordion Animations

import React, { useState } from "react";
import PersonalInfoForm from "./Forms/PersonalInfoForm";
import ProfileForm from "./Forms/ProfileForm";
import SkillsForm from "./Forms/SkillsForm";
import ExperienceForm from "./Forms/ExperienceForm";
import EducationForm from "./Forms/EducationForm";
import ReferencesForm from "./Forms/ReferencesForm";
import ExportButtons from "./Forms/ExportButtons";
import { ChevronDown } from "lucide-react";

import type { CVBuilderFormProps } from "../types/global";
import CertificatesForm from "./Forms/CertificatesForm";
import AdditionalInfoForm from "./Forms/AdditionalInfoForm";
import CompetenciesForm from "./Forms/CompetenciesForm";

interface ExtendedCVBuilderFormProps extends CVBuilderFormProps {
  saveToDatabase: () => void;
  saveStatus: "idle" | "saving" | "success" | "error";
  currentCvId: string | number | null;
  printToPdf?: () => void;
}

type AccordionSection =
  | "personal"
  | "profile"
  | "competencies"
  | "experience"
  | "education"
  | "certificates"
  | "skills"
  | "references"
  | "additionalInfo"
  | null;

const CVBuilderForm: React.FC<ExtendedCVBuilderFormProps> = ({
  personal,
  updatePersonal,
  profile,
  setProfile,
  competency,
  updateCompetency,
  addCompetency,
  removeCompetency,
  experiences,
  addExperience,
  updateExperience,
  removeExperience,
  education,
  addEducation,
  updateEducation,
  removeEducation,
  certificate,
  addCertificate,
  updateCertificate,
  removeCertificate,
  skill,
  updateSkill,
  addSkill,
  removeSkill,
  reference,
  updateReference,
  addReference,
  removeReference,
  additionalInfo,
  addAdditionalInfo,
  updateAdditionalInfo,
  removeAdditionalInfo,
  exportToDocx,
  exportToPdf,
  saveToDatabase,
  saveStatus,
  currentCvId,
  printToPdf,
}) => {
  const [openAccordion, setOpenAccordion] =
    useState<AccordionSection>("personal");

  const toggleAccordion = (section: AccordionSection) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const AccordionItem: React.FC<{
    id: AccordionSection;
    title: string;
    children: React.ReactNode;
  }> = ({ id, title, children }) => {
    const isOpen = openAccordion === id;

    return (
      <div className="border border-[#333] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleAccordion(id)}
          className="w-full px-4 py-3 flex items-center justify-between bg-[#242424] hover:bg-[#2a2a2a] transition-colors"
        >
          <h3 className="font-medium text-[#e8e6e3]">{title}</h3>
          <ChevronDown
            size={20}
            className={`text-gray-600 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Smooth collapse/expand animation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-full" : "max-h-0"
          }`}
        >
          <div className="px-4 py-3 bg-[#1a1a1a] border-t border-[#333]">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lg:col-span-1 max-h-fit overflow-y-auto bg-[#1a1a1a] rounded-xl border border-[#333] p-6">
      <h2 className="font-[family-name:var(--font-heading)] text-[#d4a853] text-lg mb-4">Spectres | Skill Stack</h2>

      {/* Current CV ID Indicator */}
      {currentCvId && (
        <div className="mb-4 text-sm text-[#8a8a8a] bg-[#242424] p-2 rounded border border-[#333]">
          Currently editing CV #{currentCvId}
        </div>
      )}

      <div className="space-y-3">
        <AccordionItem id="personal" title="Personal Information">
          <PersonalInfoForm
            personal={personal}
            updatePersonal={updatePersonal}
          />
        </AccordionItem>

        <AccordionItem id="profile" title="Professional Profile">
          <ProfileForm profile={profile} setProfile={setProfile} />
        </AccordionItem>

        <AccordionItem id="competencies" title="Core Competencies">
          <CompetenciesForm
            competency={competency}
            updateCompetency={updateCompetency}
            addCompetency={addCompetency}
            removeCompetency={removeCompetency}
          />
        </AccordionItem>

        <AccordionItem id="experience" title="Work Experience">
          <ExperienceForm
            experiences={experiences}
            addExperience={addExperience}
            updateExperience={updateExperience}
            removeExperience={removeExperience}
          />
        </AccordionItem>

        <AccordionItem id="education" title="Education & Qualifications">
          <EducationForm
            education={education}
            addEducation={addEducation}
            updateEducation={updateEducation}
            removeEducation={removeEducation}
          />
        </AccordionItem>

        <AccordionItem id="certificates" title="Certificates & Licenses">
          <CertificatesForm
            certificate={certificate}
            addCertificate={addCertificate}
            updateCertificate={updateCertificate}
            removeCertificate={removeCertificate}
          />
        </AccordionItem>
        <AccordionItem id="skills" title="Technical Competencies">
          <SkillsForm
            skill={skill}
            updateSkill={updateSkill}
            addSkill={addSkill}
            removeSkill={removeSkill}
          />
        </AccordionItem>

        <AccordionItem id="references" title="References">
          <ReferencesForm
            reference={reference}
            updateReference={updateReference}
            addReference={addReference}
            removeReference={removeReference}
          />
        </AccordionItem>

        <AccordionItem id="additionalInfo" title="Additional Information">
          <AdditionalInfoForm
            additionalInfo={additionalInfo}
            addAdditionalInfo={addAdditionalInfo}
            updateAdditionalInfo={updateAdditionalInfo}
            removeAdditionalInfo={removeAdditionalInfo}
          />
        </AccordionItem>

        {/* Save to Database Button */}
        <div className="pt-2 border-t mt-4">
          <button
            className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
              saveStatus === "saving"
                ? "bg-gray-600 cursor-not-allowed text-[#666]"
                : "bg-[#d4a853] text-[#0d0d0d] hover:bg-[#b8923e]"
            }`}
            onClick={saveToDatabase}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "Saving..."
              : currentCvId
                ? "Update CV in Database"
                : "Save CV to Database"}
          </button>
        </div>

        <ExportButtons
          exportToDocx={exportToDocx}
          exportToPdf={exportToPdf}
          printToPdf={printToPdf}
        />
      </div>
    </div>
  );
};

export default CVBuilderForm;
