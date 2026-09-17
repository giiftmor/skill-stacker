// app/components/ui/VersionHistory.tsx
"use client";
import { useEffect, useState } from "react";

interface CVVersionInfo {
  id: number;
  cvId: number;
  createdAt: string;
  preview: {
    fullName: string;
    title: string;
  };
}

interface VersionHistoryProps {
  cvId: number;
  onRestore?: (data: unknown) => void;
  onClose?: () => void;
}

export default function VersionHistory({
  cvId,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<CVVersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadVersions = async () => {
      try {
        const res = await fetch(`/api/cv/${cvId}/versions`, {
          signal: controller.signal,
        });
        const body = await res.json();
        setVersions(body.versions || []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load versions:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    loadVersions();
    return () => controller.abort();
  }, [cvId]);

  const handleRestore = async (versionId: number) => {
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/cv/${cvId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "Restore failed");
      onRestore?.(body.data);
    } catch (error) {
      console.error("Failed to restore version:", error);
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Version History</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No versions yet
            </div>
          ) : (
            <ul className="space-y-2">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {version.preview.fullName || "Unnamed"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {version.preview.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      disabled={restoring === version.id}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {restoring === version.id ? "Restoring..." : "Restore"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
