// Profile Component
import React from "react";
import type { ProfileFormProps } from "../../types/global";

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, setProfile }) => (
  <div>
    <label className="block text-sm font-medium text-ink">Profile</label>
    <textarea
      className="w-full bg-surface border border-hairline rounded-lg px-3 py-2.5 text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all duration-200 min-h-[80px]"
      rows={4}
      value={profile}
      onChange={(e) => setProfile(e.target.value)}
      placeholder="Write a brief professional summary..."
    />
  </div>
);

export default ProfileForm;
