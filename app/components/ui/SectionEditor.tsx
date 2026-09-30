"use client";

import { X } from "lucide-react";
import { useId } from "react";
import { useDialog } from "@/app/hooks/useDialog";

export function SectionEditor({
  title,
  children,
  onDone,
  onCancel,
}: {
  title: string;
  children: React.ReactNode;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `section-editor-${uid}-title`;
  const { dialogRef } = useDialog(true, onCancel);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: the backdrop is a dismiss target, not content
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="section-editor"
        className="w-full max-w-2xl rounded-lg border border-accent bg-surface p-4 shadow-md"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3
            id={titleId}
            className="font-[family-name:var(--font-heading)] text-lg text-ink"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close editor"
            className="grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-10 rounded-md border border-hairline px-4 text-sm text-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDone}
            data-testid="section-save"
            className="min-h-10 rounded-md bg-accent px-4 text-sm text-white hover:bg-desk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
