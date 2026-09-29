// app/components/ui/Sidebar.tsx
"use client";

import {
  CircleHelp,
  Eye,
  FileText,
  Inbox,
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
  { label: "Tailor queue", icon: Inbox },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Shared", icon: Share2 },
  { label: "Settings", icon: Settings },
  { label: "Help", icon: CircleHelp },
];

const ITEM_BASE =
  "flex min-h-10 w-full items-center gap-2 rounded-md border-l-2 px-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const ACTIVE_ITEM = "border-accent bg-accent-soft font-semibold text-accent";

const INACTIVE_ITEM =
  "border-transparent text-muted hover:bg-desk hover:text-ink";

const DISABLED_ITEM = "cursor-default border-transparent text-muted";

export default function AppSidebar({ active, cvId }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (section: ShellSection, href: string) =>
    active ? active === section : pathname.startsWith(href);

  const hasCv = Number.isFinite(cvId);
  const editHref = `/cvs/${cvId}/edit`;
  const previewHref = `/cvs/${cvId}/preview`;

  return (
    <aside
      data-testid="app-sidebar"
      className="no-print sticky top-14 max-h-[calc(100vh-3.5rem)] w-44 shrink-0 self-start overflow-y-auto border-r border-hairline bg-surface p-2"
    >
      <nav aria-label="CVs">
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href="/cvs"
              data-testid="nav-my-cvs"
              aria-current={isActive("cvs", "/cvs") ? "page" : undefined}
              className={`${ITEM_BASE} ${isActive("cvs", "/cvs") ? ACTIVE_ITEM : INACTIVE_ITEM}`}
            >
              <FileText size={15} aria-hidden="true" className="shrink-0" />
              My CVs
            </Link>
          </li>

          <li>
            <Link
              href="/cvs/new"
              data-testid="nav-new-cv"
              className="mt-1.5 flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline px-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Plus size={14} aria-hidden="true" />
              New CV
            </Link>
          </li>

          {hasCv && (
            <>
              <li>
                <Link
                  href={editHref}
                  data-testid="nav-edit-cv"
                  aria-current={isActive("edit", editHref) ? "page" : undefined}
                  className={`${ITEM_BASE} ${isActive("edit", editHref) ? ACTIVE_ITEM : INACTIVE_ITEM}`}
                >
                  <Pencil size={15} aria-hidden="true" className="shrink-0" />
                  Edit CV
                </Link>
              </li>
              <li>
                <Link
                  href={previewHref}
                  data-testid="nav-preview"
                  aria-current={
                    isActive("preview", previewHref) ? "page" : undefined
                  }
                  className={`${ITEM_BASE} ${isActive("preview", previewHref) ? ACTIVE_ITEM : INACTIVE_ITEM}`}
                >
                  <Eye size={15} aria-hidden="true" className="shrink-0" />
                  Preview
                </Link>
              </li>
            </>
          )}

          <li className="my-2 border-t border-hairline" aria-hidden="true" />

          {SOON_ITEMS.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span
                aria-disabled="true"
                data-testid={`nav-soon-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`${ITEM_BASE} ${DISABLED_ITEM}`}
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
      </nav>
    </aside>
  );
}
