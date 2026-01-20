// Personal Information Types
type PersonalInfo = {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
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
  skill: string[];
  addSkill: () => void;
  updateSkill: (idx: number, value: string) => void;
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
    value: string,
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
    value: string,
  ) => void;
  removeEducation: (id: string | number) => void;
};

type Reference = {
  id: string | number;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
};

// References Types
type ReferencesFormProps = {
  reference: Reference[];
  addReference: () => void;
  updateReference: (
    id: string | number,
    field: keyof Reference,
    value: string,
  ) => void;
  removeReference: (id: string | number) => void;
};

type Certificate = {
  id: string | number;
  name: string;
  date: string;
};

type CertificatesFormProps = {
  certificate: Certificate[];
  addCertificate: () => void;
  updateCertificate: (
    id: number | string,
    field: keyof Certificate,
    value: string,
  ) => void;
  removeCertificate: (id: string | number) => void;
};

type AdditionalInfoFormProps = {
  additionalInfo: string[];
  addAdditionalInfo: () => void;
  updateAdditionalInfo: (idx: number, value: string) => void;
  removeAdditionalInfo: (idx: number) => void;
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
  skill: string[];
  experiences: Experience[];
  education: Education[];
  certificate: Certificate[];
  reference: Reference[];
  additionalInfo: string[];
  className?: string;
  previewRef?: React.Ref<HTMLDivElement>;
};

// Export Function Props
type ExportFunctionProps = {
  personal: PersonalInfo;
  profile: string;
  skill: string[];
  experiences: Experience[];
  education: Education[];
  // certificate: Certificate[];
  reference: Reference[];
  // additionalInfo: string[];
  previewRef?: React.RefObject<HTMLDivElement | null>;
};

//Main CV Builder Form Props
type CVBuilderFormProps = {
  ///////////----- Personal Information and Profile Summary ------/////////////
  personal: any;
  updatePersonal: (field: keyof PersonalInfo, value: string) => void;
  profile: any;
  setProfile: (value: string) => void;

  ///////////----- Skills ------/////////////
  skill: any[];
  addSkill: () => void;
  updateSkill: (idx: number, value: string) => void;
  removeSkill: (idx: number) => void;

  ///////////----- Experience ------/////////////
  experiences: any[];
  addExperience: () => void;
  updateExperience: (
    id: string | number,
    field: keyof Experience,
    value: string,
  ) => void;
  removeExperience: (id: string | number) => void;

  ///////////----- Education ------/////////////
  education: any[];
  addEducation: () => void;
  updateEducation: (
    id: string | number,
    field: keyof Education,
    value: string,
  ) => void;
  removeEducation: (id: string | number) => void;

  ///////////----- References ------/////////////
  reference: any[];
  addReference: () => void;
  updateReference: (
    id: string | number,
    field: keyof Reference,
    value: string,
  ) => void;
  removeReference: (id: string | number) => void;

  ///////////----- Certificates ------/////////////
  certificate: any[];
  addCertificate: () => void;
  updateCertificate: (
    id: string | number,
    field: keyof Certificate,
    value: string,
  ) => void;
  removeCertificate: (id: string | number) => void;

  ///////////----- Addtional Info ------/////////////
  additionalInfo: any[];
  addAdditionalInfo: () => void;
  updateAdditionalInfo: (idx: number, value: string) => void;
  removeAdditionalInfo: (idx: number) => void;

  ///////////----- Education ------/////////////
  exportToDocx: () => void;
  exportToPdf: () => void;
  className?: string;
};

export type {
  //Form Props
  PersonalInfoFormProps,
  ProfileFormProps,
  SkillsFormProps,
  ExperienceFormProps,
  EducationFormProps,
  CertificatesFormProps,
  ReferencesFormProps,
  AdditionalInfoFormProps,

  //Function/Component Props
  ExportButtonsProps,
  CVPreviewProps,
  CVBuilderFormProps,
  ExportFunctionProps,
};
