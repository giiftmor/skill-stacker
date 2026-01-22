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
    {/* <label className="block text-sm font-medium text-gray-700">
      Competencies
    </label> */}
    <div className="space-y-2 mt-2">
      {competency.map((competency, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={competency}
            onChange={(e) => updateCompetency(idx, e.target.value)}
            placeholder="Enter a competency"
          />
          <button
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onClick={() => removeCompetency(idx)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={addCompetency}
      >
        Add Competency
      </button>
    </div>
  </div>
);

export default CompetenciesForm;
