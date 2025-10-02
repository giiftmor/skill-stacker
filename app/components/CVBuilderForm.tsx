// Main Form Container Component

import React from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ProfileForm from "./ProfileForm";
import SkillsForm from "./SkillsForm";
import ExperienceForm from "./ExperienceForm";
import EducationForm from "./EducationForm";
import ReferencesForm from "./ReferencesForm";
import ExportButtons from "./ExportButtons";

import type { CVBuilderFormProps } from "../types/global";

const CVBuilderForm: React.FC<CVBuilderFormProps> = ({
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
}) => (
  <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">Spectres | Skill Stack</h2>
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
      <ExportButtons exportToDocx={exportToDocx} exportToPdf={exportToPdf} />
    </div>
  </div>
);

export default CVBuilderForm;
