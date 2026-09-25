"use client";

import { useEffect, useState } from "react";
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
    <div
      className="fixed inset-x-0 top-16 z-40 mx-auto w-full max-w-lg px-4"
      role="dialog"
      aria-label="Command menu"
    >
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to a section, or type an action…"
          className="w-full border-b border-hairline bg-transparent px-4 py-3 outline-none text-ink"
        />
        <ul className="max-h-80 overflow-auto p-1">
          {items.map((i) => (
            <li key={i.type + i.value}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-accent-soft"
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
  );
}
