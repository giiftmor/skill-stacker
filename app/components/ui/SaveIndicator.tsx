// app/components/ui/SaveIndicator.tsx
"use client";
import { Check, Loader2, X } from "lucide-react";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "success" | "error";
}

const COPY: Record<
  Exclude<SaveIndicatorProps["status"], "idle">,
  { label: string; className: string }
> = {
  saving: { label: "Saving…", className: "text-status-warn" },
  success: { label: "Saved ✓", className: "text-status-good" },
  error: { label: "Save failed", className: "text-status-warn" },
};

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const { label, className } = COPY[status];

  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is the required contract, not <output>
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm"
    >
      <span className={`flex items-center gap-1.5 ${className}`}>
        {status === "saving" && (
          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
        )}
        {status === "success" && (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {status === "error" && <X aria-hidden="true" className="h-3.5 w-3.5" />}
        {label}
      </span>
    </div>
  );
}
