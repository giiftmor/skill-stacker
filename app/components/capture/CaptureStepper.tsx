"use client";

import { Check } from "lucide-react";

export type CaptureStepId = "personal" | "work" | "education" | "style";

export const CAPTURE_STEPS: { id: CaptureStepId; label: string }[] = [
  { id: "personal", label: "You" },
  { id: "work", label: "Work" },
  { id: "education", label: "Education & Skills" },
  { id: "style", label: "Style" },
];

export function CaptureStepper({
  step, percent, onNavigate,
}: {
  step: CaptureStepId;
  percent: number;
  onNavigate: (step: CaptureStepId) => void;
}) {
  const idx = CAPTURE_STEPS.findIndex((s) => s.id === step);
  return (
    <nav className="mx-auto max-w-3xl px-6 pt-8">
      <ol className="flex items-center gap-1">
        {CAPTURE_STEPS.map((s, i) => (
          <li key={s.id} className={`flex items-center gap-1 ${i < CAPTURE_STEPS.length - 1 ? "flex-1" : ""}`}>
            <button
              onClick={() => onNavigate(s.id)}
              aria-current={s.id === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                i === idx
                  ? "border-accent bg-accent text-surface"
                  : i < idx
                    ? "border-hairline bg-surface text-accent"
                    : "border-hairline bg-surface text-muted"
              }`}
            >
              {i < idx ? <Check size={14} /> : <span>{i + 1}</span>}
              {s.label}
            </button>
            {i < CAPTURE_STEPS.length - 1 && <span className="h-px flex-1 bg-hairline" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-hairline">
        <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{percent}% complete so far</p>
    </nav>
  );
}