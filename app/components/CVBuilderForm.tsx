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
  skills,
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
  references,
  updateReference,
  addReference,
  removeReference,
  exportToDocx,
  exportToPdf,
  saveToDatabase,
  saveStatus,
  currentCvId,
}) => (
  <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">Spectres | Skill Stack</h2>

    {/* Save Status Indicator */}
    {saveStatus !== "idle" && (
      <div
        className={`mb-4 p-3 rounded-md ${
          saveStatus === "saving"
            ? "bg-blue-50 text-blue-800"
            : saveStatus === "success"
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }`}
      >
        {saveStatus === "saving" && "💾 Saving CV..."}
        {saveStatus === "success" && "✅ CV saved successfully!"}
        {saveStatus === "error" && "❌ Failed to save CV"}
      </div>
    )}

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
        skills={skills}
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
      <ReferencesForm
        references={references}
        updateReference={updateReference}
        addReference={addReference}
        removeReference={removeReference}
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
