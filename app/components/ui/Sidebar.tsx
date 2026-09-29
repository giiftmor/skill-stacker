// app/components/ui/Sidebar.tsx
"use client";

import {
  CircleHelp,
  Eye,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Pencil,
  Plus,
  Settings,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShellSection } from "@/app/components/ui/AppShell";

interface SidebarProps {
  active?: ShellSection;
  cvId?: number;
}

const SOON_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Shared", icon: Share2 },
  { label: "Settings", icon: Settings },
  { label: "Help", icon: CircleHelp },
];

export default function AppSidebar({ active, cvId }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (section: ShellSection, href: string) =>
    active ? active === section : pathname === href;

  const navItemClass = (isOn: boolean) =>
    [
      "flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
      isOn
        ? "border-l-2 border-accent bg-accent-soft pl-[6px] font-semibold text-accent"
        : "border-l-2 border-transparent text-muted hover:bg-desk hover:text-ink",
    ].join(" ");

  return (
    <aside
      data-testid="app-sidebar"
      className="no-print sticky top-0 flex h-screen w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-hairline bg-surface p-2"
    >
      <Link
        href="/cvs"
        data-testid="nav-my-cvs"
        aria-current={isActive("cvs", "/cvs") ? "page" : undefined}
        className={navItemClass(isActive("cvs", "/cvs"))}
      >
        <FileText size={15} aria-hidden="true" className="shrink-0" />
        My CVs
      </Link>

      <Link
        href="/cvs/new"
        data-testid="nav-new-cv"
        className="mt-1.5 flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline px-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Plus size={14} aria-hidden="true" />
        New CV
      </Link>

      {cvId !== undefined && (
        <>
          <Link
            href={`/cvs/${cvId}/edit`}
            data-testid="nav-edit-cv"
            aria-current={
              isActive("edit", `/cvs/${cvId}/edit`) ? "page" : undefined
            }
            className={navItemClass(isActive("edit", `/cvs/${cvId}/edit`))}
          >
            <Pencil size={15} aria-hidden="true" className="shrink-0" />
            Edit CV
          </Link>
          <Link
            href={`/cvs/${cvId}/preview`}
            data-testid="nav-preview"
            aria-current={
              isActive("preview", `/cvs/${cvId}/preview`) ? "page" : undefined
            }
            className={navItemClass(
              isActive("preview", `/cvs/${cvId}/preview`),
            )}
          >
            <Eye size={15} aria-hidden="true" className="shrink-0" />
            Preview
          </Link>
        </>
      )}

      <div className="my-2 border-t border-hairline" />

      <ul className="flex flex-col gap-0.5">
        {SOON_ITEMS.map(({ label, icon: Icon }) => (
          <li key={label}>
            <span
              aria-disabled="true"
              data-testid={`nav-soon-${label.toLowerCase()}`}
              className={navItemClass(false)}
            >
              <Icon size={15} aria-hidden="true" className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              <span className="text-[10px] tracking-wide text-faint">
                Coming soon
              </span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
