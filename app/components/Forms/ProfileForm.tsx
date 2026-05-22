// Profile Component
import React from "react";
import type { ProfileFormProps } from "../../types/global";

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, setProfile }) => (
  <div>
    <label className="block text-sm font-medium text-[#e8e6e3]">Profile</label>
    <textarea
      className="w-full bg-[#242424] border border-[#333] rounded-lg px-3 py-2.5 text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200 min-h-[80px]"
      rows={4}
      value={profile}
      onChange={(e) => setProfile(e.target.value)}
      placeholder="Write a brief professional summary..."
    />
  </div>
);

export default ProfileForm;
