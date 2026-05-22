import React, { useState, useCallback } from "react";
import type { PersonalInfoFormProps } from "../../types/global";
import { validateField } from "../../lib/schemas";

const PersonalInfoForm = ({ personal, updatePersonal }: PersonalInfoFormProps) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((field: string, value: string) => {
    const result = validateField(field, value);
    if (!result.valid && result.error) {
      setErrors((prev) => ({ ...prev, [field]: result.error! }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field, value);
  };

  const handleChange = (field: string, value: string) => {
    updatePersonal(field as keyof typeof personal, value);
    if (touched[field]) {
      validate(field, value);
    }
  };

  const getInputClass = (field: string) => {
    const baseClass = "w-full bg-[#242424] border rounded-lg px-3 py-2.5 text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:ring-2 transition-all duration-200";
    if (touched[field] && errors[field]) {
      return `${baseClass} border-[#dc4444] focus:border-[#dc4444] focus:ring-[#dc444422]`;
    }
    return `${baseClass} border-[#333] focus:border-[#d4a853] focus:ring-[#d4a85315]`;
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[#e8e6e3]">
          Full name <span className="text-[#dc4444]">*</span>
        </label>
        <input
          className={getInputClass("fullName")}
          value={personal.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={(e) => handleBlur("fullName", e.target.value)}
          placeholder="Enter your full name"
        />
        {touched.fullName && errors.fullName && (
          <p className="text-[#dc4444] text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#e8e6e3]">
          Title (e.g., Retail Assistant)
        </label>
        <input
          className={getInputClass("title")}
          value={personal.title}
          onChange={(e) => handleChange("title", e.target.value)}
          onBlur={(e) => handleBlur("title", e.target.value)}
          placeholder="e.g., Senior Software Engineer"
        />
        {touched.title && errors.title && (
          <p className="text-[#dc4444] text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-[#e8e6e3]">Phone</label>
          <input
            className={getInputClass("phone")}
            value={personal.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={(e) => handleBlur("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
          {touched.phone && errors.phone && (
            <p className="text-[#dc4444] text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#e8e6e3]">Email</label>
          <input
            type="email"
            className={getInputClass("email")}
            value={personal.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            placeholder="you@example.com"
          />
          {touched.email && errors.email && (
            <p className="text-[#dc4444] text-sm mt-1">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#e8e6e3]">
          Location
        </label>
        <input
          className={getInputClass("location")}
          value={personal.location}
          onChange={(e) => handleChange("location", e.target.value)}
          onBlur={(e) => handleBlur("location", e.target.value)}
          placeholder="City, State"
        />
        {touched.location && errors.location && (
          <p className="text-[#dc4444] text-sm mt-1">{errors.location}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#e8e6e3]">
          LinkedIn Profile (Optional)
        </label>
        <input
          className={getInputClass("linkedin")}
          value={personal.linkedin}
          onChange={(e) => handleChange("linkedin", e.target.value)}
          onBlur={(e) => handleBlur("linkedin", e.target.value)}
          placeholder="linkedin.com/in/yourprofile"
        />
        {touched.linkedin && errors.linkedin && (
          <p className="text-[#dc4444] text-sm mt-1">{errors.linkedin}</p>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoForm;
