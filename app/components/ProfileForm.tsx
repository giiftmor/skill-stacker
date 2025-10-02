// Profile Component
import React from "react";
import type { ProfileFormProps } from "../types/global";

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, setProfile }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">Profile</label>
    <textarea
      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      rows={4}
      value={profile}
      onChange={(e) => setProfile(e.target.value)}
      placeholder="Write a brief professional summary..."
    />
  </div>
);

export default ProfileForm;
