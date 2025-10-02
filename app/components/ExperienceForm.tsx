//Experience Form Component
import React from "react";
import type { ExperienceFormProps } from "../types/global";
const ExperienceForm = ({
  experiences,
  addExperience,
  updateExperience,
  removeExperience,
}: ExperienceFormProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Experience
    </label>
    <div className="space-y-3 mt-2">
      {experiences.map((exp) => (
        <div
          key={exp.id}
          className="border border-gray-200 p-3 rounded-md bg-gray-50"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Company"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={exp.company}
              onChange={(e) =>
                updateExperience(exp.id, "company", e.target.value)
              }
            />
            <input
              placeholder="Role"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={exp.role}
              onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
            />
          </div>
          <input
            placeholder="Period (e.g., Jan 2020 - Dec 2022)"
            className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={exp.period}
            onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
          />
          <textarea
            placeholder="Details / Achievements"
            className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={exp.details}
            onChange={(e) =>
              updateExperience(exp.id, "details", e.target.value)
            }
          />
          <div className="mt-2">
            <button
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              onClick={() => removeExperience(exp.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={addExperience}
      >
        Add Experience
      </button>
    </div>
  </div>
);

export default ExperienceForm;
