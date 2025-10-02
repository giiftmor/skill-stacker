// Education Component
import React from "react";
import type { EducationFormProps } from "../types/global";

const EducationForm: React.FC<EducationFormProps> = ({
  education,
  addEducation,
  updateEducation,
  removeEducation,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Education & Qualifications
    </label>
    <div className="space-y-3 mt-2">
      {education.map((ed) => (
        <div
          key={ed.id}
          className="border border-gray-200 p-3 rounded-md bg-gray-50"
        >
          <input
            placeholder="Institution"
            className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ed.institution}
            onChange={(e) =>
              updateEducation(ed.id, "institution", e.target.value)
            }
          />
          <input
            placeholder="Qualification/Degree"
            className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ed.qualification}
            onChange={(e) =>
              updateEducation(ed.id, "qualification", e.target.value)
            }
          />
          <input
            placeholder="Period (e.g., Graduated: May 2021 or Started: 2022 (Incomplete))"
            className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ed.period}
            onChange={(e) => updateEducation(ed.id, "period", e.target.value)}
          />
          <div className="mt-2">
            <button
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              onClick={() => removeEducation(ed.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={addEducation}
      >
        Add Education
      </button>
    </div>
  </div>
);

export default EducationForm;
