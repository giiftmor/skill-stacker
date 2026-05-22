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
    const baseClass = "w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:border-transparent";
    if (touched[field] && errors[field]) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }
    return `${baseClass} border-gray-300 focus:ring-blue-500`;
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          className={getInputClass("fullName")}
          value={personal.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={(e) => handleBlur("fullName", e.target.value)}
          placeholder="Enter your full name"
        />
        {touched.fullName && errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
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
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            className={getInputClass("phone")}
            value={personal.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={(e) => handleBlur("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
          {touched.phone && errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className={getInputClass("email")}
            value={personal.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            placeholder="you@example.com"
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
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
          <p className="text-red-500 text-sm mt-1">{errors.location}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
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
          <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoForm;