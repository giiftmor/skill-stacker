//Experience Form Component
import React from "react";
import type { ExperienceFormProps } from "../../types/global";
const ExperienceForm = ({
  experiences,
  addExperience,
  updateExperience,
  removeExperience,
}: ExperienceFormProps) => (
  <div>
    <label className="block text-sm font-medium text-[#e8e6e3]">
      Experience
    </label>
    <div className="space-y-3 mt-2">
      {experiences.map((exp) => (
        <div
          key={exp.id}
          className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Company"
              className="px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
              value={exp.company}
              onChange={(e) =>
                updateExperience(exp.id, "company", e.target.value)
              }
            />
            <input
              placeholder="Role"
              className="px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
              value={exp.role}
              onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
            />
          </div>
          <input
            placeholder="Period (e.g., Jan 2020 - Dec 2022)"
            className="mt-2 px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
            value={exp.period}
            onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
          />
          <textarea
            placeholder="Details / Achievements"
            className="mt-2 px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200 min-h-[80px]"
            rows={3}
            value={exp.details}
            onChange={(e) =>
              updateExperience(exp.id, "details", e.target.value)
            }
          />
          <div className="mt-2">
            <button
              className="px-3 py-1.5 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
              onClick={() => removeExperience(exp.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        className="px-4 py-2 bg-[#d4a85315] text-[#d4a853] hover:bg-[#d4a85325] border border-[#d4a85340] rounded-lg transition-all duration-200"
        onClick={addExperience}
      >
        Add Experience
      </button>
    </div>
  </div>
);

export default ExperienceForm;
