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
            className="flex-1 bg-[#242424] border border-[#333] rounded-lg px-3 py-2.5 text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
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
        className="mt-2 px-4 py-2 bg-[#d4a85315] text-[#d4a853] hover:bg-[#d4a85325] border border-[#d4a85340] rounded-lg transition-all duration-200"
        onClick={addCompetency}
      >
        Add Competency
      </button>
    </div>
  </div>
);

export default CompetenciesForm;
