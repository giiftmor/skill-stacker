"use client";

import { X } from "lucide-react";

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
  return (
    <div
      data-testid="section-editor"
      className="rounded-lg border border-accent bg-surface p-4 shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-heading)] text-lg text-ink">
          {title}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          className="rounded-md p-1 text-muted hover:bg-accent-soft"
        >
          <X size={16} />
        </button>
      </div>
      {children}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-hairline px-4 py-2 text-sm text-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDone}
          data-testid="section-save"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
