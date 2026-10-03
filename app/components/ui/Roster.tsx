"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, Download, MoreVertical, Plus, Trash2, FileText } from "lucide-react";
import { type SectionKey } from "@/app/lib/readiness";
import { exportCVToBlob } from "@/app/lib/export/exportDispatcher";

interface RosterRow {
  id: number;
  slug: string;
  fullName: string;
  title: string;
  readyOverride: boolean;
  sections: SectionKey[];
  readinessPercent: number;
  updatedAt: string;
}

interface RosterProps {
  cvs: RosterRow[];
}

const THUMB_SECTIONS = ["personal", "profile", "experiences", "education", "skill", "reference"] as SectionKey[];

function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const days = Math.floor(delta / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function Roster({ cvs }: RosterProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "drafting" | "ready">("all");
  const [menuId, setMenuId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const status = (row: RosterRow) => {
    const derivedReady = row.readinessPercent >= 100;
    if (row.readyOverride || derivedReady) return "ready";
    return "drafting";
  };

  const rows = useMemo(() => {
    const list = [...cvs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return filter === "all" ? list : list.filter((r) => status(r) === filter);
  }, [cvs, filter]);

  const updateReady = async (row: RosterRow, ready: boolean) => {
    setBusy(row.id);
    await fetch(`/api/resume/${row.slug}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ready }),
    });
    router.refresh();
    setBusy(null);
  };

  const doDelete = async (slug: string) => {
    await fetch(`/api/resume/${slug}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    setMenuId(null);
    router.refresh();
  };

  const duplicate = async (row: RosterRow) => {
    setBusy(row.id);
    const res = await fetch(`/api/resume/${row.slug}`);
    const { cv } = await res.json();
    const strip = (items: Array<Record<string, unknown>>) =>
      items.map(({ id: _id, ...rest }) => rest);
    await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personal: { fullName: `${cv.full_name} (copy)`, title: cv.title, phone: cv.phone, email: cv.email, location: cv.location, linkedin: cv.linkedin },
        profile: cv.profile ?? "",
        competency: cv.competency ?? [],
        experiences: strip(cv.experiences ?? []),
        education: strip(cv.education ?? []),
        certificate: strip(cv.certificate ?? []),
        skill: cv.skill ?? [],
        reference: strip(cv.reference ?? []),
        additionalInfo: cv.additionalInfo ?? [],
        templateSettings: cv.template_settings ?? {},
      }),
    });
    setBusy(null);
    router.refresh();
  };

  const quickPdf = async (row: RosterRow) => {
    setBusy(row.id);
    const res = await fetch(`/api/resume/${row.slug}`);
    const { cv } = await res.json();
    const blob = await exportCVToBlob("pdf", {
      data: {
        personal: { fullName: cv.full_name, title: cv.title, phone: cv.phone, email: cv.email, location: cv.location, linkedin: cv.linkedin },
        profile: cv.profile ?? "",
        competency: cv.competency ?? [],
        experiences: cv.experiences ?? [],
        education: cv.education ?? [],
        certificate: cv.certificate ?? [],
        skill: cv.skill ?? [],
        reference: cv.reference ?? [],
        additionalInfo: cv.additionalInfo ?? [],
      },
      templateId: cv.template_settings?.template ?? "classic",
      themeId: cv.template_settings?.theme,
      fontPairId: cv.template_settings?.fontPair,
      photoUrl: `/api/photo/${row.id}`,
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(cv.full_name || "Resume").replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(null);
  };

  if (cvs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 data-testid="roster-title" className="font-[family-name:var(--font-heading)] text-3xl text-ink">Client Resumes</h1>
        <p className="mt-3 text-muted">Two steps to a client-ready resume.</p>
        <p className="mt-1 text-sm text-muted">1. Answer a few guided questions · 2. Review and polish the result in the editor.</p>
        <Link href="/resumes/new" className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-surface">
          <Plus size={16} /> Start your first client resume
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 data-testid="roster-title" className="font-[family-name:var(--font-heading)] text-3xl text-ink">Client Resumes</h1>
        <Link href="/resumes/new" className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-surface">
          <Plus size={16} /> New client resume
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {(["all", "drafting", "ready"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={f === filter ? "rounded-full bg-ink px-3 py-1 text-sm text-white" : "rounded-full border border-hairline bg-surface px-3 py-1 text-sm text-muted"}
          >
            {f === "all" ? "All" : f === "drafting" ? "Drafting" : "Ready to send"}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((row) => {
          const st = status(row);
          const manual = row.readyOverride;
          return (
            <li
              key={row.id}
              data-testid={`row-${row.slug}`}
              className="flex items-center gap-4 rounded-lg border border-hairline bg-surface p-4"
            >
              <svg viewBox="0 0 40 52" className="h-14 w-11 shrink-0 rounded-sm border border-hairline bg-white p-1" aria-hidden>
                <rect x="2" y="4" width="36" height="4" rx="1" className="fill-hairline" />
                {THUMB_SECTIONS.map((s, i) => (
                  <rect
                    key={s}
                    x="2"
                    y={10 + i * 7}
                    width={row.sections.includes(s) ? 30 : 16}
                    height="3"
                    rx="1"
                    className={row.sections.includes(s) ? "fill-accent" : "fill-hairline"}
                  />
                ))}
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{row.fullName || "Untitled Resume"}</span>
                  {manual && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">manual</span>}
                </div>
                <p className="truncate text-sm text-muted">{row.title || "No headline yet"}</p>
                <p className="text-xs text-faint">Updated {timeAgo(row.updatedAt)} · {row.readinessPercent}% complete</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  data-testid={`ready-dot-${row.slug}`}
                  className={
                    st === "ready"
                      ? "inline-flex h-2.5 w-2.5 rounded-full bg-status-good"
                      : "inline-flex h-2.5 w-2.5 rounded-full bg-status-warn"
                  }
                  title={st === "ready" ? "Ready to send" : "Drafting"}
                />
                <Link
                  href={`/resumes/${row.slug}/edit`}
                  className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink"
                >
                  Open
                </Link>
                <button
                  onClick={() => quickPdf(row)}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1.5 text-sm text-muted"
                  aria-label="Quick PDF"
                >
                  <Download size={14} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setMenuId(menuId === row.id ? null : row.id)}
                    className="rounded-md border border-hairline p-1.5 text-muted"
                    aria-label="More"
                    aria-expanded={menuId === row.id}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuId === row.id && (
                    <div className="absolute right-0 top-9 z-10 w-56 rounded-lg border border-hairline bg-surface p-2 shadow-lg">
                      <button
                        onClick={() => updateReady(row, !row.readyOverride)}
                        disabled={busy === row.id}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-accent-soft"
                        role="menuitem"
                      >
                        {row.readyOverride ? <Circle size={14} /> : <Check size={14} />}
                        {row.readyOverride ? "Clear mark ready" : "Mark ready"}
                      </button>
                      <button
                        onClick={() => duplicate(row)}
                        disabled={busy === row.id}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-accent-soft"
                        role="menuitem"
                      >
                        <FileText size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(row.id); setMenuId(null); }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-status-warn hover:bg-accent-soft"
                        role="menuitem"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                  {confirmDeleteId === row.id && (
                    <div
                      data-testid="confirm-delete"
                      className="absolute right-0 top-9 z-10 w-56 rounded-lg border border-hairline bg-surface p-3 shadow-lg"
                    >
                      <p className="text-sm text-ink">Delete this resume?</p>
                      <p className="mt-1 text-xs text-muted">This cannot be undone.</p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md border border-hairline px-3 py-1.5 text-sm text-muted"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => doDelete(row.slug)}
                          disabled={busy === row.id}
                          className="rounded-md bg-status-warn px-3 py-1.5 text-sm text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}