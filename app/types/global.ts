
import type {ReactNode} from "react";
// Personal Information Types
type PersonalInfo = {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  location: string;
};

type PersonalInfoFormProps = {
  personal: PersonalInfo;
  updatePersonal: (field: keyof PersonalInfo, value: string) => void;
};

// Profile Types
type ProfileFormProps = {
  profile: string;
  setProfile: (value: string) => void;
};

// Skills Types
type SkillsFormProps = {
  skills: string[];
  updateSkill: (idx: number, value: string) => void;
  addSkill: () => void;
  removeSkill: (idx: number) => void;
};

//Experience Form Types
type Experience = {
  id: string | number;
  company: string;
  role: string;
  period: string;
  details: string;
};

type ExperienceFormProps = {
  experiences: Experience[];
  addExperience: () => void;
  updateExperience: (
    id: string | number,
    field: keyof Experience,
    value: string
  ) => void;
  removeExperience: (id: string | number) => void;
};

// Education Types
type Education = {
  id: string | number;
  institution: string;
  qualification: string;
  period: string;
};

type EducationFormProps = {
  education: Education[];
  addEducation: () => void;
  updateEducation: (
    id: string | number,
    field: keyof Education,
    value: string
  ) => void;
  removeEducation: (id: string | number) => void;
};

// References Types
type ReferencesFormProps = {
  references: string[];
  updateReference: (idx: number, value: string) => void;
  addReference: () => void;
  removeReference: (idx: number) => void;
};

// Export Buttons Types
type ExportButtonsProps = {
  exportToDocx: () => void;
  exportToPdf: () => void;
};

// CV Preview Types
type CVPreviewProps = {
  personal: PersonalInfo;
  profile?: string;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  references: string[];
  className?: string;
  previewRef?: React.Ref<HTMLDivElement>;
};

type ExportFunctionProps = {
  personal: PersonalInfo;
  profile: string;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  references: string[];
  previewRef?: React.RefObject<HTMLDivElement | null>;
};

//Main CV Builder Form Props
type CVBuilderFormProps = {
  personal: any;
   updatePersonal: (field: keyof PersonalInfo, value: string) => void;
  profile: any;
    setProfile: (value: string) => void;
  skills: any[];
  updateSkill: (idx: number, value: string) => void;
  addSkill: () => void;
  removeSkill: (idx: number) => void;
  experiences: any[];
  addExperience: () => void;
  updateExperience: (
    id: string | number,
    field: keyof Experience,
    value: string
  ) => void;
  removeExperience: (id: string | number) => void;
  education: any[];
  addEducation: () => void;
  updateEducation: (
    id: string | number,
    field: keyof Education,
    value: string
  ) => void;
  removeEducation: (id: string | number) => void;
  references: any[];
  updateReference: (idx: number, value: string) => void;
  addReference: () => void;
  removeReference: (idx: number) => void;
  exportToDocx: () => void;
  exportToPdf: () => void;
  className?: string;
};

export type { 
  PersonalInfo,
  PersonalInfoFormProps,
  ProfileFormProps,
  SkillsFormProps,
  Experience,
  ExperienceFormProps,
  Education,
  EducationFormProps,
  ReferencesFormProps,
  ExportButtonsProps,
  CVPreviewProps,
  CVBuilderFormProps,
  ExportFunctionProps,
};