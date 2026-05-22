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
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cvs" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold">{title}</h1>
          {showSave && saveStatus && <SaveIndicator status={saveStatus} />}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}