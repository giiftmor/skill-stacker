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
    <label className="block text-sm font-medium text-ink">
      Experience
    </label>
    <div className="space-y-3 mt-2">
      {experiences.map((exp) => (
        <div
          key={exp.id}
          className="bg-surface border border-hairline rounded-lg p-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Company"
              className="px-3 py-2.5 bg-surface border border-hairline rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
              value={exp.company}
              onChange={(e) =>
                updateExperience(exp.id, "company", e.target.value)
              }
            />
            <input
              placeholder="Role"
              className="px-3 py-2.5 bg-surface border border-hairline rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
              value={exp.role}
              onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
            />
          </div>
          <input
            placeholder="Period (e.g., Jan 2020 - Dec 2022)"
            className="mt-2 px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={exp.period}
            onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
          />
          <textarea
            placeholder="Details / Achievements"
            className="mt-2 px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200 min-h-[80px]"
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
        className="px-4 py-2 bg-accent-soft text-accent hover:bg-accent-soft border border-accent-soft rounded-lg transition-all duration-200"
        onClick={addExperience}
      >
        Add Experience
      </button>
    </div>
  </div>
);

export default ExperienceForm;
