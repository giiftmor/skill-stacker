// app/components/ui/UploadPhoto.tsx
"use client";
import { useState } from "react";

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
      <label className="block text-sm font-medium text-gray-700">Photo</label>
      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="CV Photo"
            className="w-32 h-32 object-cover rounded-lg border"
          />
          <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white cursor-pointer rounded-lg opacity-0 hover:opacity-100 transition-opacity">
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
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <span className="text-gray-400 text-2xl">📷</span>
          <span className="text-sm text-gray-500 mt-1">
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}