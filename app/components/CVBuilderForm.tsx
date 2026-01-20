// app/components/CVBuilderForm.tsx - Updated with Save Button

import React from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ProfileForm from "./ProfileForm";
import SkillsForm from "./SkillsForm";
import ExperienceForm from "./ExperienceForm";
import EducationForm from "./EducationForm";
import ReferencesForm from "./ReferencesForm";
import ExportButtons from "./ExportButtons";

import type { CVBuilderFormProps } from "../types/global";
import CertificatesForm from "./CertificatesForm";
import AdditionalInfoForm from "./AdditionalInfoForm";

interface ExtendedCVBuilderFormProps extends CVBuilderFormProps {
  saveToDatabase: () => void;
  saveStatus: "idle" | "saving" | "success" | "error";
  currentCvId: number | null;
}

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
}) => (
  <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">Spectres | Skill Stack</h2>

    {/* Current CV ID Indicator */}
    {currentCvId && (
      <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
        Currently editing CV #{currentCvId}
      </div>
    )}

    <div className="space-y-4">
      <PersonalInfoForm personal={personal} updatePersonal={updatePersonal} />
      <ProfileForm profile={profile} setProfile={setProfile} />
      <SkillsForm
        skill={skill}
        updateSkill={updateSkill}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />
      <ExperienceForm
        experiences={experiences}
        addExperience={addExperience}
        updateExperience={updateExperience}
        removeExperience={removeExperience}
      />
      <EducationForm
        education={education}
        addEducation={addEducation}
        updateEducation={updateEducation}
        removeEducation={removeEducation}
      />
      <CertificatesForm
        certificate={certificate}
        addCertificate={addCertificate}
        updateCertificate={updateCertificate}
        removeCertificate={removeCertificate}
      />
      <ReferencesForm
        reference={reference}
        updateReference={updateReference}
        addReference={addReference}
        removeReference={removeReference}
      />

      <AdditionalInfoForm
        additionalInfo={additionalInfo}
        addAdditionalInfo={addAdditionalInfo}
        updateAdditionalInfo={updateAdditionalInfo}
        removeAdditionalInfo={removeAdditionalInfo}
      />

      {/* Save to Database Button */}
      <div className="pt-4 border-t">
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
export default CVBuilderForm;
