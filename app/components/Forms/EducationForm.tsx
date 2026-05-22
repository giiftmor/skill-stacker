// Education Component
import React from "react";
import type { EducationFormProps } from "../../types/global";

const EducationForm: React.FC<EducationFormProps> = ({
  education,
  addEducation,
  updateEducation,
  removeEducation,
}) => (
  <div>
    <label className="block text-sm font-medium text-[#e8e6e3]">
      Education & Qualifications
    </label>
    <div className="space-y-3 mt-2">
      {education.map((ed) => (
        <div
          key={ed.id}
          className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4"
        >
          <input
            placeholder="Institution"
            className="px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
            value={ed.institution}
            onChange={(e) =>
              updateEducation(ed.id, "institution", e.target.value)
            }
          />
          <input
            placeholder="Qualification/Degree"
            className="mt-2 px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
            value={ed.qualification}
            onChange={(e) =>
              updateEducation(ed.id, "qualification", e.target.value)
            }
          />
          <input
            placeholder="Period (e.g., Graduated: May 2021 or Started: 2022 (Incomplete))"
            className="mt-2 px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
            value={ed.period}
            onChange={(e) => updateEducation(ed.id, "period", e.target.value)}
          />
          <div className="mt-2">
            <button
              className="px-3 py-1.5 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
              onClick={() => removeEducation(ed.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        className="px-4 py-2 bg-[#d4a85315] text-[#d4a853] hover:bg-[#d4a85325] border border-[#d4a85340] rounded-lg transition-all duration-200"
        onClick={addEducation}
      >
        Add Education
      </button>
    </div>
  </div>
);

export default EducationForm;
