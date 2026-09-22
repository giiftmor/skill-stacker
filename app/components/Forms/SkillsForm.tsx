//Skills Form Component
import React from "react";
import type { SkillsFormProps } from "../../types/global";

const SkillsForm: React.FC<SkillsFormProps> = ({
  skill,
  updateSkill,
  addSkill,
  removeSkill,
}) => (
  <div>
    <label className="block text-sm font-medium text-ink">Skills</label>
    <div className="space-y-2 mt-2">
      {skill.map((skill, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-hairline rounded-lg px-3 py-2.5 text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={skill}
            onChange={(e) => updateSkill(idx, e.target.value)}
            placeholder="Enter a skill"
          />
          <button
            className="px-3 py-2 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
            onClick={() => removeSkill(idx)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="mt-2 px-4 py-2 bg-accent-soft text-accent hover:bg-accent-soft border border-accent-soft rounded-lg transition-all duration-200"
        onClick={addSkill}
      >
        Add Skill
      </button>
    </div>
  </div>
);

export default SkillsForm;
