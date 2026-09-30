// app/components/ui/VersionHistory.tsx
"use client";
import { useEffect, useId, useState } from "react";
import { useDialog } from "@/app/hooks/useDialog";

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
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `version-history-${uid}-title`;
  const { dialogRef } = useDialog(true, () => onClose?.());

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
      <div
        ref={(node) => {
          dialogRef.current = node;
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-hairline p-4">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-heading)] text-lg text-ink"
          >
            Version History
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close version history"
            className="grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-muted">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-muted">No versions yet</div>
          ) : (
            <ul className="space-y-2">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="rounded-lg border border-hairline p-3 hover:bg-canvas"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-ink">
                        {version.preview.fullName || "Unnamed"}
                      </div>
                      <div className="text-sm text-muted">
                        {version.preview.title}
                      </div>
                      <div className="mt-1 text-xs text-faint">
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      disabled={restoring === version.id}
                      className="min-h-10 rounded-md bg-accent px-3 text-sm text-white hover:bg-desk hover:text-ink disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
