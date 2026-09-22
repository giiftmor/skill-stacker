// References Component
import React from "react";
import type { ReferencesFormProps } from "../../types/global";
const ReferencesForm: React.FC<ReferencesFormProps> = ({
  reference,
  updateReference,
  addReference,
  removeReference,
}) => (
  <div>
    <label className="block text-sm font-medium text-ink">
      References
    </label>
    <div className="space-y-3 mt-2">
      {reference.map((ref) => (
        <div
          key={ref.id}
          className="bg-surface border border-hairline rounded-lg p-4"
        >
          <input
            placeholder="Full Name"
            className="px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={ref.name}
            onChange={(e) => updateReference(ref.id, "name", e.target.value)}
          />
          <input
            placeholder="Role / Job Title"
            className="mt-2 px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={ref.role}
            onChange={(e) => updateReference(ref.id, "role", e.target.value)}
          />
          <input
            placeholder="Company"
            className="mt-2 px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={ref.company}
            onChange={(e) => updateReference(ref.id, "company", e.target.value)}
          />
          <input
            placeholder="Email Address"
            className="mt-2 px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={ref.email}
            onChange={(e) => updateReference(ref.id, "email", e.target.value)}
          />
          <input
            placeholder="Phone number"
            className="mt-2 px-3 py-2.5 bg-surface border border-hairline rounded-lg w-full text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200"
            value={ref.phone}
            onChange={(e) => updateReference(ref.id, "phone", e.target.value)}
          />
          <div className="mt-2">
            <button
              className="px-3 py-1.5 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
              onClick={() => removeReference(ref.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        className="px-4 py-2 bg-accent-soft text-accent hover:bg-accent-soft border border-accent-soft rounded-lg transition-all duration-200"
        onClick={addReference}
      >
        Add Reference
      </button>
    </div>
  </div>
);
export default ReferencesForm;
