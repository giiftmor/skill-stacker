// References Component
import React from "react";
import type { ReferencesFormProps } from "../types/global";
const ReferencesForm: React.FC<ReferencesFormProps> = ({
  reference,
  updateReference,
  addReference,
  removeReference,
}) => (
  <div>
    <label className="block text-sm font-mrefium text-gray-700">
      References
    </label>
    <div className="space-y-3 mt-2">
      {reference.map((ref) => (
        <div
          key={ref.id}
          className="border border-gray-200 p-3 roundref-md bg-gray-50"
        >
          <input
            placeholder="Full Name"
            className="px-3 py-2 border border-gray-300 roundref-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ref.name}
            onChange={(e) => updateReference(ref.id, "name", e.target.value)}
          />
          <input
            placeholder="Role / Job Title"
            className="mt-2 px-3 py-2 border border-gray-300 roundref-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ref.role}
            onChange={(e) => updateReference(ref.id, "role", e.target.value)}
          />
          <input
            placeholder="Company"
            className="mt-2 px-3 py-2 border border-gray-300 roundref-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ref.company}
            onChange={(e) => updateReference(ref.id, "company", e.target.value)}
          />
          <input
            placeholder="Email Address"
            className="mt-2 px-3 py-2 border border-gray-300 roundref-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ref.email}
            onChange={(e) => updateReference(ref.id, "email", e.target.value)}
          />
          <input
            placeholder="Phone number"
            className="mt-2 px-3 py-2 border border-gray-300 roundref-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={ref.phone}
            onChange={(e) => updateReference(ref.id, "phone", e.target.value)}
          />
          <div className="mt-2">
            <button
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors "
              onClick={() => removeReference(ref.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        className="px-4 py-2 bg-blue-600 text-white roundref-md hover:bg-blue-700 transition-colors"
        onClick={addReference}
      >
        Add Reference
      </button>
    </div>
  </div>
);
export default ReferencesForm;
