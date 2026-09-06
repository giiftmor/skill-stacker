"use client";
import { useState } from "react";
import type { TailorApplyUpdate, TailorDiff } from "../../lib/tailor/types";
import { DiffSection } from "./DiffSection";

type ProgressStep =
  | "idle"
  | "scraping"
  | "extracting"
  | "tailoring"
  | "done"
  | "error";

export function TailorPanel({
  cv,
  onApply,
}: {
  cv: Record<string, unknown>;
  onApply: (update: TailorApplyUpdate) => void;
}) {
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [step, setStep] = useState<ProgressStep>("idle");
  const [diffs, setDiffs] = useState<TailorDiff[]>([]);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const analyze = async () => {
    setStep("scraping");
    setError("");
    setDiffs([]);
    setAppliedKeys(new Set());

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(jobUrl.trim() ? { jobUrl: jobUrl.trim() } : { jobText }),
          cv,
        }),
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          const evt = JSON.parse(line);
          if (evt.type === "status") setStep(evt.step);
          else if (evt.type === "diff") setDiffs(evt.diffs);
          else if (evt.type === "error") {
            setStep("error");
            setError(evt.message);
          } else if (evt.type === "done") setStep("done");
        }
      }
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const applyDiff = (diff: TailorDiff) => {
    const update: TailorApplyUpdate = {};
    if (diff.section === "profile") update.profile = diff.proposed;
    else if (diff.section === "skill")
      update.skill = diff.proposed.split("\n").filter(Boolean);
    else if (diff.section === "competency")
      update.competency = diff.proposed.split("\n").filter(Boolean);
    else if (diff.section === "experience") {
      const id = diff.key.replace(/^experience:/, "");
      update.experiences = [{ id: id || undefined, details: diff.proposed }];
    }
    onApply(update);
    setAppliedKeys((prev) => new Set(prev).add(diff.key));
  };

  const stepLabel: Record<ProgressStep, string> = {
    idle: "Ready",
    scraping: "Reading job ad…",
    extracting: "Extracting requirements…",
    tailoring: "Tailoring your CV…",
    done: "Done",
    error: "Error",
  };

  return (
    <div className="rounded-lg border border-[#333] bg-[#151515] p-4 mb-6">
      <h3 className="font-semibold text-[#e8e6e3] mb-3">Tailor for job</h3>

      {step === "idle" && (
        <div className="flex flex-col gap-2">
          <input
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="Paste a job-ad URL"
            className="px-3 py-2 rounded bg-[#242424] text-[#e8e6e3] border border-[#333]"
          />
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="…or paste the job text directly"
            rows={3}
            className="px-3 py-2 rounded bg-[#242424] text-[#e8e6e3] border border-[#333]"
          />
          <button
            onClick={analyze}
            type="button"
            className="px-4 py-2 rounded bg-[#d4a853] text-[#0d0d0d] font-medium self-start"
          >
            Analyze
          </button>
        </div>
      )}

      {step !== "idle" && (
        <p className="text-sm text-[#d4a853] mb-3">{stepLabel[step]}</p>
      )}

      {error && <p className="text-sm text-red-400 mb-3">⚠ {error}</p>}

      {diffs.length > 0 && (
        <div className="flex flex-col gap-3">
          {diffs.map((d) => (
            <DiffSection
              key={d.key}
              diff={d}
              applied={appliedKeys.has(d.key)}
              onApply={() => applyDiff(d)}
              onReject={() =>
                setDiffs((prev) => prev.filter((x) => x.key !== d.key))
              }
            />
          ))}
        </div>
      )}

      {step === "done" && diffs.length === 0 && (
        <p className="text-sm text-[#8a8a8a]">No safe changes suggested.</p>
      )}
    </div>
  );
}
