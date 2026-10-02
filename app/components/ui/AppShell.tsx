"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Breadcrumb from "@/app/components/ui/Breadcrumb";
import AppSidebar from "@/app/components/ui/Sidebar";
import ThemeToggle from "@/app/components/ui/ThemeToggle";

export type ShellSection = "resumes" | "edit" | "preview";

interface AppShellProps {
  children: ReactNode;
  active?: ShellSection;
  slug?: string;
  title?: string;
  onOpenCommand?: () => void;
}

export const SIDEBAR_STORAGE_KEY = "skill-stacker:sidebar-collapsed";
const SIDEBAR_NARROW_QUERY = "(max-width: 1279px)";

function readStoredCollapsed(): boolean | null {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export default function AppShell({
  children,
  active,
  slug,
  title,
  onOpenCommand,
}: AppShellProps) {
  const crumbs = title
    ? [{ label: "Resumes", href: "/resumes" }, { label: title }]
    : [{ label: "Resumes", href: "/resumes" }];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      (readStoredCollapsed() ??
        window.matchMedia?.(SIDEBAR_NARROW_QUERY).matches ??
        false),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        sidebarCollapsed ? "1" : "0",
      );
    } catch {
      // storage unavailable (private mode, disabled cookies)
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  return (
    <div
      data-testid="app-shell"
      className="flex min-h-screen flex-col bg-canvas text-ink print:min-h-0 print:bg-white"
    >
      <header className="no-print sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4">
        <Link
          href="/resumes"
          className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="grid h-6 w-6 shrink-0 grid-cols-2 grid-rows-2 gap-[3px] rounded-md bg-ink p-[5px]"
          >
            <span className="rounded-[2px] bg-accent" />
            <span className="rounded-[2px] bg-accent" />
            <span className="rounded-[2px] bg-accent" />
            <span className="rounded-[2px] bg-accent" />
          </span>
          <span className="text-sm font-extrabold tracking-tight text-ink whitespace-nowrap">
            Skill Stacker
          </span>
        </Link>
        <span aria-hidden="true" className="text-xs text-faint">
          /
        </span>
        <Breadcrumb
          items={crumbs}
          className="min-w-0 overflow-hidden text-xs"
          currentClassName="truncate italic"
        />
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          {onOpenCommand && (
            <button
              type="button"
              onClick={onOpenCommand}
              aria-label="Open command menu (Ctrl+K)"
              title="Open command menu (Ctrl+K)"
              data-testid="open-command"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-hairline bg-surface text-muted transition-colors hover:bg-desk hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Search size={15} aria-hidden="true" />
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 print:block">
        <AppSidebar
          active={active}
          slug={slug}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
