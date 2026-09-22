//Competencies Form Component
import React from "react";
import type { CompetenciesFormProps } from "../../types/global";

const CompetenciesForm: React.FC<CompetenciesFormProps> = ({
  competency,
  updateCompetency,
  addCompetency,
  removeCompetency,
}) => (
  <div>
    <div className="space-y-2 mt-2">
      {competency.map((competency, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-hairline rounded-lg px-3 py-2.5 text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={competency}
            onChange={(e) => updateCompetency(idx, e.target.value)}
            placeholder="Enter a competency"
          />
          <button
            className="px-3 py-2 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
            onClick={() => removeCompetency(idx)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="mt-2 px-4 py-2 bg-accent-soft text-accent hover:bg-accent-soft border border-accent-soft rounded-lg transition-all duration-200"
        onClick={addCompetency}
      >
        Add Competency
      </button>
    </div>
  </div>
);

export default CompetenciesForm;
