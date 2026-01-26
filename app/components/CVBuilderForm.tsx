// app/components/CVBuilderForm.tsx - With Smooth Accordion Animations

import React, { useState } from "react";
import PersonalInfoForm from "./Forms/PersonalInfoForm";
import ProfileForm from "./Forms/ProfileForm";
import SkillsForm from "./Forms/SkillsForm";
import ExperienceForm from "./Forms/ExperienceForm";
import EducationForm from "./Forms/EducationForm";
import ReferencesForm from "./Forms/ReferencesForm";
import ExportButtons from "./ExportButtons";
import { ChevronDown } from "lucide-react";

import type { CVBuilderFormProps } from "../types/global";
import CertificatesForm from "./Forms/CertificatesForm";
import AdditionalInfoForm from "./Forms/AdditionalInfoForm";

interface ExtendedCVBuilderFormProps extends CVBuilderFormProps {
  saveToDatabase: () => void;
  saveStatus: "idle" | "saving" | "success" | "error";
  currentCvId: string | number | null;
}

type AccordionSection =
  | "personal"
  | "profile"
  | "skills"
  | "experience"
  | "education"
  | "certificates"
  | "references"
  | "additionalInfo"
  | null;

const CVBuilderForm: React.FC<ExtendedCVBuilderFormProps> = ({
  personal,
  updatePersonal,
  profile,
  setProfile,
  skill,
  updateSkill,
  addSkill,
  removeSkill,
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
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleAccordion(id)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h3 className="font-medium text-gray-900">{title}</h3>
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
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            {children}
          </div>
        </div>

        <style jsx>{`
          @media (max-height: 600px) {
            .accordion-content {
              max-height: ${isOpen ? "500px" : "0"} !important;
            }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Spectres | Skill Stack</h2>

      {/* Current CV ID Indicator */}
      {currentCvId && (
        <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
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

        <AccordionItem id="skills" title="Technical Skills">
          <SkillsForm
            skill={skill}
            updateSkill={updateSkill}
            addSkill={addSkill}
            removeSkill={removeSkill}
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
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
              saveStatus === "saving"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } text-white`}
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

        <ExportButtons exportToDocx={exportToDocx} exportToPdf={exportToPdf} />
      </div>
    </div>
  );
};

export default CVBuilderForm;
