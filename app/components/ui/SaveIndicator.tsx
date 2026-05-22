// app/components/ui/SaveIndicator.tsx
"use client";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "success" | "error";
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "idle" && (
        <span className="text-gray-500">Ready to save</span>
      )}
      {status === "saving" && (
        <span className="flex items-center gap-2 text-yellow-600">
          <span className="animate-spin">⏳</span>
          Saving...
        </span>
      )}
      {status === "success" && (
        <span className="flex items-center gap-2 text-green-600">
          <span>✓</span>
          Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-2 text-red-600">
          <span>✗</span>
          Save failed
        </span>
      )}
    </div>
  );
}