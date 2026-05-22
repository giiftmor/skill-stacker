// app/components/ui/SaveIndicator.tsx
"use client";
import { Loader2, Check, X, Clock } from "lucide-react";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "success" | "error";
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "idle" && (
        <span className="flex items-center gap-2 text-[#666]">
          <Clock className="h-3.5 w-3.5" />
          Ready to save
        </span>
      )}
      {status === "saving" && (
        <span className="flex items-center gap-2 text-[#f59e0b]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving...
        </span>
      )}
      {status === "success" && (
        <span className="flex items-center gap-2 text-[#4caf50]">
          <Check className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-2 text-[#dc4444]">
          <X className="h-3.5 w-3.5" />
          Save failed
        </span>
      )}
    </div>
  );
}