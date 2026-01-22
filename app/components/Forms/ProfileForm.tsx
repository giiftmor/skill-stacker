// app/components/ProfileForm.tsx - Updated with formatting support
import React, { useState } from "react";
import type { ProfileFormProps } from "../../types/global";
import FormattedText from "../FormattedText";

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, setProfile }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="mx-2">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Profile
        </label>
        {profile && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        )}
      </div>

      <textarea
        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        rows={4}
        value={profile}
        onChange={(e) => setProfile(e.target.value)}
        placeholder="Write a brief professional summary. Supports formatting: - bullets, 1. numbers, **bold**"
      />

      {showPreview && profile && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-md">
          <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
          <FormattedText text={profile} className="text-sm text-gray-800" />
        </div>
      )}
    </div>
  );
};

export default ProfileForm;
