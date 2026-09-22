// app/components/ui/Header.tsx
"use client";
import Link from "next/link";
import SaveIndicator from "./SaveIndicator";

interface HeaderProps {
  title: string;
  saveStatus?: "idle" | "saving" | "success" | "error";
  showSave?: boolean;
  actions?: React.ReactNode;
}

export default function Header({ title, saveStatus, showSave = false, actions }: HeaderProps) {
  return (
    <header className="bg-surface border-b border-hairline sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cvs" className="text-muted hover:text-accent">
            ← Back
          </Link>
          <h1 className="text-lg font-bold font-[family-name:var(--font-heading)] text-ink">{title}</h1>
          {showSave && saveStatus && <SaveIndicator status={saveStatus} />}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}