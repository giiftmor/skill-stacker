// Additional Info Component
import React from "react";
import type { AdditionalInfoFormProps } from "../../types/global";
const AdditionalInfoForm = ({
  additionalInfo,
  updateAdditionalInfo,
  addAdditionalInfo,
  removeAdditionalInfo,
}: AdditionalInfoFormProps) => (
  <div>
    <label className="block text-sm font-medium text-ink">
      Personal Information
    </label>
    <div className="space-y-2 mt-2">
      {additionalInfo.map((info, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-hairline rounded-lg px-3 py-2.5 text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={info}
            onChange={(e) => updateAdditionalInfo(idx, e.target.value)}
            placeholder="Additional details"
          />
          <button
            className="px-3 py-2 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
            onClick={() => removeAdditionalInfo(idx)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="mt-2 px-4 py-2 bg-accent-soft text-accent hover:bg-accent-soft border border-accent-soft rounded-lg transition-all duration-200"
        onClick={addAdditionalInfo}
      >
        Add More
      </button>
    </div>
  </div>
);
export default AdditionalInfoForm;
