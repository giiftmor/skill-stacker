// Additional Info Component
import React from "react";
import type { AdditionalInfoFormProps } from "../types/global";
const AdditionalInfoForm = ({
  additionalInfo,
  updateAdditionalInfo,
  addAdditionalInfo,
  removeAdditionalInfo,
}: AdditionalInfoFormProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Personal Infomartion
    </label>
    <div className="space-y-2 mt-2">
      {additionalInfo.map((info, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={info}
            onChange={(e) => updateAdditionalInfo(idx, e.target.value)}
            placeholder="Additional details"
          />
          <button
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onClick={() => removeAdditionalInfo(idx)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={addAdditionalInfo}
      >
        Add More
      </button>
    </div>
  </div>
);
export default AdditionalInfoForm;
