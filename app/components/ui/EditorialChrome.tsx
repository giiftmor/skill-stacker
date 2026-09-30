"use client";

import { ArrowLeft, Check, Eye, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import SaveIndicator from "@/app/components/ui/SaveIndicator";

export type SaveStatus = "idle" | "saving" | "success" | "error";

const ITEM_BASE =
  "actions-drawer-item flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[9px] border bg-surface px-3.5 text-xs font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "CV";
}

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
  const [railOpen, setRailOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const toggleId = `editorial-actions-${uid}`;
  const railId = `${toggleId}-rail`;
  const run = (action: () => void) => {
    // Activating a rail item unmounts it, so hand focus back to the toggle
    // before the action runs; an ensuing dialog or route change takes over.
    setRailOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
    action();
  };

  return (
    <header className="sticky top-14 z-20 border-b border-hairline bg-surface">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link
          href="/cvs"
          className="flex min-h-10 items-center gap-1 rounded-md border border-hairline px-2.5 text-sm text-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" /> CVs
        </Link>
        <input
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          aria-label="CV name"
          className="min-h-10 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 font-[family-name:var(--font-heading)] text-lg text-ink outline-none transition hover:border-hairline focus:border-accent"
        />
        <SaveIndicator status={saveStatus} />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            id={toggleId}
            ref={toggleRef}
            aria-expanded={railOpen}
            aria-controls={railOpen ? railId : undefined}
            onClick={() => setRailOpen((v) => !v)}
            className="flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 text-xs font-semibold text-muted hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Actions
            <span
              aria-hidden="true"
              className={`inline-block transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
                railOpen ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>
          <span
            aria-hidden="true"
            title={name}
            className="grid h-10 min-w-10 place-items-center rounded-full border border-accent/40 bg-accent-soft px-2 text-xs font-bold text-accent"
          >
            {initialsFor(name)}
          </span>
        </div>
      </div>
      {railOpen && (
        // biome-ignore lint/a11y/useSemanticElements: role="region" is the required contract, not <section>
        <div
          id={railId}
          role="region"
          aria-labelledby={toggleId}
          className="actions-drawer flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-2.5"
        >
          <button
            type="button"
            onClick={() => run(onHistory)}
            className={ITEM_BASE}
          >
            <History size={14} aria-hidden="true" /> History
          </button>
          <button
            type="button"
            onClick={() => run(onToggleReady)}
            className={`${ITEM_BASE} border-accent/40 bg-accent-soft font-semibold text-accent`}
          >
            <Check size={14} aria-hidden="true" />
            {isReadySet ? "Cleared" : "Mark ready"}
          </button>
          <button
            type="button"
            onClick={() => run(onExportDocx)}
            className={ITEM_BASE}
          >
            Word
          </button>
          <button
            type="button"
            onClick={() => run(onExportPdf)}
            className={`${ITEM_BASE} border-accent bg-accent font-semibold text-white hover:bg-desk hover:text-ink`}
          >
            Quick PDF
          </button>
          <button
            type="button"
            onClick={() => run(() => router.push(`/cvs/${cvId}/preview`))}
            className={`${ITEM_BASE} outline-2 outline-offset-2 outline-accent hover:border-accent hover:text-accent`}
          >
            <Eye size={14} aria-hidden="true" /> Preview
          </button>
        </div>
      )}
    </header>
  );
}
