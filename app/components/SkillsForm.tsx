//Skills Form Component
import React from "react";
import type { SkillsFormProps } from "../types/global";

const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  updateSkill,
  addSkill,
  removeSkill,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">Skills</label>
    <div className="space-y-2 mt-2">
      {skills.map((skill, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={skill}
            onChange={(e) => updateSkill(idx, e.target.value)}
            placeholder="Enter a skill"
          />
          <button
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onClick={() => removeSkill(idx)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={addSkill}
      >
        Add Skill
      </button>
    </div>
  </div>
);

export default SkillsForm;
