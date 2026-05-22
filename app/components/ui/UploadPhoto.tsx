// app/components/ui/UploadPhoto.tsx
"use client";
import { useState } from "react";
import { Camera } from "lucide-react";

interface UploadPhotoProps {
  cvId: number;
  onUploadComplete?: (photoUrl: string) => void;
}

export default function UploadPhoto({ cvId, onUploadComplete }: UploadPhotoProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("cvId", cvId.toString());

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      const photoUrl = `/api/photo/${cvId}`;
      setPreview(photoUrl);
      onUploadComplete?.(photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#e8e6e3]">Photo</label>
      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="CV Photo"
            className="w-32 h-32 object-cover rounded-lg border border-[#333]"
          />
          <label className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white cursor-pointer rounded-lg opacity-0 hover:opacity-100 transition-opacity">
            <span>Change</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-[#444] rounded-lg cursor-pointer hover:border-[#d4a853] transition-colors bg-[#242424]">
          <Camera className="text-[#666] w-6 h-6" />
          <span className="text-sm text-[#666] mt-1">
            {uploading ? "Uploading..." : "Add Photo"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="text-[#dc4444] text-sm">{error}</p>}
    </div>
  );
}