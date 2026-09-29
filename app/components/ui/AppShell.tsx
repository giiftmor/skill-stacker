"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Breadcrumb from "@/app/components/ui/Breadcrumb";
import AppSidebar from "@/app/components/ui/Sidebar";
import ThemeToggle from "@/app/components/ui/ThemeToggle";

export type ShellSection = "cvs" | "edit" | "preview";

interface AppShellProps {
  children: ReactNode;
  active?: ShellSection;
  cvId?: number;
  title?: string;
}

export default function AppShell({
  children,
  active,
  cvId,
  title,
}: AppShellProps) {
  const crumbs = title
    ? [{ label: "CVs", href: "/cvs" }, { label: title }]
    : [{ label: "CVs", href: "/cvs" }];

  return (
    <div
      data-testid="app-shell"
      className="flex min-h-screen flex-col bg-canvas text-ink print:min-h-0 print:bg-white"
    >
      <header className="no-print sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4">
        <Link
          href="/cvs"
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
          <ThemeToggle />
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
          >
            LB
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 print:block">
        <AppSidebar active={active} cvId={cvId} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
