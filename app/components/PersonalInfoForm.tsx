// Import React
import React from "react";
import {} from "../types/global";
import type { PersonalInfoFormProps } from "../types/global";

// Personal Information Component

const PersonalInfoForm = ({
  personal,
  updatePersonal,
}: PersonalInfoFormProps) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Full name
      </label>
      <input
        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={personal.fullName}
        onChange={(e) => updatePersonal("fullName", e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Title (e.g., Retail Assistant)
      </label>
      <input
        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={personal.title}
        onChange={(e) => updatePersonal("title", e.target.value)}
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={personal.phone}
          onChange={(e) => updatePersonal("phone", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={personal.email}
          onChange={(e) => updatePersonal("email", e.target.value)}
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Location
      </label>
      <input
        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={personal.location}
        onChange={(e) => updatePersonal("location", e.target.value)}
      />
    </div>
  </div>
);

export default PersonalInfoForm;
