"use client";

import { useState } from "react";
import { useDialog } from "@/app/hooks/useDialog";
import { SECTION_KEYS, SECTION_LABELS } from "@/app/lib/readiness";

export function CommandMenu({
  open,
  onClose,
  onJump,
  onExportPdf,
  onExportDocx,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  onJump: (key: string) => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const { dialogRef } = useDialog(open, onClose);

  if (!open) return null;
  const q = query.toLowerCase();
  const items = [
    ...SECTION_KEYS.map((k) => ({
      type: "section" as const,
      label: SECTION_LABELS[k],
      value: k,
    })),
    { type: "action" as const, label: "Export PDF", value: "pdf" },
    { type: "action" as const, label: "Export Word", value: "docx" },
    { type: "action" as const, label: "Back to CVs", value: "back" },
  ].filter((i) => !q || i.label.toLowerCase().includes(q));

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/40"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        tabIndex={-1}
        className="fixed inset-x-0 top-16 z-40 mx-auto w-full max-w-lg px-4"
      >
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a section, or type an action…"
            className="w-full border-b border-hairline bg-transparent px-4 py-3 text-ink outline-none"
          />
          <ul className="max-h-80 overflow-auto p-1">
            {items.map((i) => (
              <li key={i.type + i.value}>
                <button
                  type="button"
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-ink hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => {
                    setQuery("");
                    if (i.type === "section") onJump(i.value);
                    else if (i.value === "pdf") onExportPdf();
                    else if (i.value === "docx") onExportDocx();
                    else onBack();
                    onClose();
                  }}
                >
                  {i.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
