import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100, "Name is too long"),
  title: z.string().max(100, "Title is too long").optional(),
  phone: z.string()
    .regex(/^[\d\s\-().+]+$/, "Invalid phone format")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  location: z.string().max(100, "Location is too long").optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().max(100, "Company name is too long").optional(),
  role: z.string().max(100, "Role is too long").optional(),
  period: z.string().max(50, "Period is too long").optional(),
  details: z.string().max(2000, "Details are too long").optional(),
});

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string().max(100, "Institution is too long").optional(),
  qualification: z.string().max(100, "Qualification is too long").optional(),
  period: z.string().max(50, "Period is too long").optional(),
});

export const certificateSchema = z.object({
  id: z.string(),
  name: z.string().max(100, "Certificate name is too long").optional(),
  date: z.string().max(20, "Date is too long").optional(),
});

export const referenceSchema = z.object({
  id: z.string(),
  name: z.string().max(100, "Name is too long").optional(),
  company: z.string().max(100, "Company is too long").optional(),
  role: z.string().max(100, "Role is too long").optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string()
    .regex(/^[\d\s\-().+]+$/, "Invalid phone format")
    .optional()
    .or(z.literal("")),
});

export const cvSchema = z.object({
  personal: personalInfoSchema,
  profile: z.string().max(2000, "Profile is too long").optional(),
  competency: z.array(z.string().max(100)).max(20, "Too many competencies"),
  experiences: z.array(experienceSchema).max(20, "Too many experiences"),
  education: z.array(educationSchema).max(10, "Too many education entries"),
  certificate: z.array(certificateSchema).max(20, "Too many certificates"),
  skill: z.array(z.string().max(100)).max(50, "Too many skills"),
  reference: z.array(referenceSchema).max(10, "Too many references"),
  additionalInfo: z.array(z.string().max(500)).max(10, "Too many additional info items"),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type ReferenceInput = z.infer<typeof referenceSchema>;
export type CVInput = z.infer<typeof cvSchema>;

export function validateField(
  fieldName: string,
  value: unknown
): { valid: boolean; error?: string } {
  const fieldSchemas: Record<string, z.ZodTypeAny> = {
    fullName: personalInfoSchema.shape.fullName,
    title: personalInfoSchema.shape.title,
    phone: personalInfoSchema.shape.phone,
    email: personalInfoSchema.shape.email,
    location: personalInfoSchema.shape.location,
    linkedin: personalInfoSchema.shape.linkedin,
  };

  const schema = fieldSchemas[fieldName];
  if (!schema) {
    return { valid: true };
  }

  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true };
  }

  const errorMessage = result.error.issues[0]?.message || "Invalid value";
  return { valid: false, error: errorMessage };
}