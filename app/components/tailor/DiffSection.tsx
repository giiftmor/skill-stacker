import { guardNoFabrication } from "../../lib/tailor/tailor";
import type { TailorDiff } from "../../lib/tailor/types";

export function DiffSection({ diff, applied, onApply, onReject }: {
  diff: TailorDiff;
  applied: boolean;
  onApply: () => void;
  onReject: () => void;
}) {
  if (diff.status === "original") {
    return (
      <div className="rounded border border-[#333] p-3 text-[#8a8a8a] text-sm">
        {diff.label} — unchanged
      </div>
    );
  }
  const guard = guardNoFabrication(diff.original, diff.proposed);
  return (
    <div className="rounded border border-[#333] p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-[#e8e6e3]">{diff.label}</h4>
        {applied ? (
          <span className="text-xs text-green-400">Applied</span>
        ) : (
          <div className="flex gap-2">
            <button onClick={onReject} className="px-3 py-1 text-xs rounded border border-[#555] text-[#cfcfcf]" disabled={applied}>
              Reject
            </button>
            <button onClick={onApply} className="px-3 py-1 text-xs rounded bg-[#d4a853] text-[#0d0d0d]" disabled={applied}>
              Apply
            </button>
          </div>
        )}
      </div>
      {!guard.ok && (
        <p className="text-xs text-amber-400 mb-2">⚠ {guard.reason}</p>
      )}
      <p className="text-sm text-[#8a8a8a]"><del className="text-red-400">{diff.original}</del></p>
      <p className="text-sm text-[#e8e6e3]"><mark className="bg-[#d4a853]/20 text-[#e8e6e3]">{diff.proposed}</mark></p>
    </div>
  );
}
