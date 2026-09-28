"use client";

import { ArrowLeft, Eye, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SaveIndicator from "@/app/components/ui/SaveIndicator";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export function EditorialChrome({
  name,
  onChangeName,
  saveStatus,
  cvId,
  onHistory,
  onExportPdf,
  onExportDocx,
  onToggleReady,
  isReadySet,
}: {
  name: string;
  onChangeName: (value: string) => void;
  saveStatus: SaveStatus;
  cvId: number;
  onHistory: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onToggleReady: () => void;
  isReadySet: boolean;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link
          href="/cvs"
          className="flex items-center gap-1 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted"
        >
          <ArrowLeft size={14} /> CVs
        </Link>
        <input
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          aria-label="CV name"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-[family-name:var(--font-heading)] text-lg text-ink outline-none transition hover:border-hairline focus:border-accent"
        />
        <SaveIndicator status={saveStatus} />
        <button
          type="button"
          onClick={onToggleReady}
          className="rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted"
          title="Mark ready"
        >
          {isReadySet ? "Cleared" : "Mark ready"}
        </button>
        <button
          type="button"
          onClick={onHistory}
          className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted"
        >
          <History size={14} /> History
        </button>
        <button
          type="button"
          onClick={onExportDocx}
          className="rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted"
        >
          Word
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-white"
        >
          Quick PDF
        </button>
        <button
          type="button"
          onClick={() => router.push(`/cvs/${cvId}/preview`)}
          className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted"
        >
          <Eye size={14} /> Preview
        </button>
      </div>
    </header>
  );
}
