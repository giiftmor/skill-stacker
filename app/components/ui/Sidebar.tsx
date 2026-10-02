// app/components/ui/Sidebar.tsx
"use client";

import {
  ChevronsUpDown,
  CircleHelp,
  Eye,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Settings,
  Share2,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShellSection } from "@/app/components/ui/AppShell";

interface SidebarProps {
  active?: ShellSection;
  cvId?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
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

const COLLAPSED_ITEM = "justify-center gap-0 px-0";

const ACTIVE_ITEM = "border-accent bg-accent-soft font-semibold text-accent";

const INACTIVE_ITEM =
  "border-transparent text-muted hover:bg-desk hover:text-ink";

const DISABLED_ITEM =
  "cursor-default border-transparent text-xs text-faint hover:bg-transparent";

const SECTION_HEADING =
  "px-2 pb-0.5 pt-1 text-[10px] font-semibold tracking-wider text-faint uppercase";

export default function AppSidebar({
  active,
  cvId,
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (section: ShellSection, href: string) =>
    active ? active === section : pathname.startsWith(href);

  const navLinkClass = (section: ShellSection, href: string) =>
    `${ITEM_BASE} ${collapsed ? COLLAPSED_ITEM : ""} ${
      isActive(section, href) ? ACTIVE_ITEM : INACTIVE_ITEM
    }`;

  const label = (text: string) => (
    <span className={collapsed ? "sr-only" : ""}>{text}</span>
  );

  const hasCv = Number.isFinite(cvId);
  const editHref = `/cvs/${cvId}/edit`;
  const previewHref = `/cvs/${cvId}/preview`;

  return (
    <aside
      data-testid="app-sidebar"
      className={`no-print sticky top-14 h-[calc(100vh-3.5rem)] ${collapsed ? "w-14" : "w-44"} shrink-0 self-start border-r border-hairline bg-surface p-2 transition-[width] duration-200 flex flex-col`}
    >
      <nav aria-label="Sidebar" className="flex flex-1 flex-col gap-2">
        <div>
          {!collapsed && <p className={SECTION_HEADING}>Workspace</p>}
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                href="/cvs"
                data-testid="nav-my-cvs"
                title={collapsed ? "My CVs" : undefined}
                aria-current={isActive("cvs", "/cvs") ? "page" : undefined}
                className={navLinkClass("cvs", "/cvs")}
              >
                <FileText size={15} aria-hidden="true" className="shrink-0" />
                {label("My CVs")}
              </Link>
            </li>

            <li>
              <Link
                href="/cvs/new"
                data-testid="nav-new-cv"
                title={collapsed ? "New CV" : undefined}
                className={`mt-1.5 flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline px-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${collapsed ? "mt-0" : ""}`}
              >
                <Plus size={14} aria-hidden="true" />
                {label("New CV")}
              </Link>
            </li>
          </ul>
        </div>

        {hasCv && (
          <div>
            {!collapsed && <p className={SECTION_HEADING}>This CV</p>}
            <ul className="flex flex-col gap-0.5">
              <li>
                <Link
                  href={editHref}
                  data-testid="nav-edit-cv"
                  title={collapsed ? "Edit CV" : undefined}
                  aria-current={isActive("edit", editHref) ? "page" : undefined}
                  className={navLinkClass("edit", editHref)}
                >
                  <Pencil size={15} aria-hidden="true" className="shrink-0" />
                  {label("Edit CV")}
                </Link>
              </li>
              <li>
                <Link
                  href={previewHref}
                  data-testid="nav-preview"
                  title={collapsed ? "Preview" : undefined}
                  aria-current={
                    isActive("preview", previewHref) ? "page" : undefined
                  }
                  className={navLinkClass("preview", previewHref)}
                >
                  <Eye size={15} aria-hidden="true" className="shrink-0" />
                  {label("Preview")}
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div>
          {!collapsed && <p className={SECTION_HEADING}>Coming soon</p>}
          <ul className="flex flex-col gap-0.5">
            {SOON_ITEMS.map(({ label: itemLabel, icon: Icon }) => (
              <li key={itemLabel}>
                <span
                  aria-disabled="true"
                  data-testid={`nav-soon-${itemLabel.toLowerCase().replace(/\s+/g, "-")}`}
                  title={collapsed ? itemLabel : undefined}
                  className={`${ITEM_BASE} ${collapsed ? COLLAPSED_ITEM : ""} ${DISABLED_ITEM}`}
                >
                  <Icon size={15} aria-hidden="true" className="shrink-0" />
                  {label(itemLabel)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div
        data-testid="sidebar-footer"
        className="mt-auto border-t border-hairline pt-2"
      >
        <div
          data-testid="account-container"
          title={collapsed ? "Sign in" : undefined}
          className={`flex min-h-10 items-center gap-2 rounded-md ${collapsed ? "justify-center" : "px-2"}`}
        >
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-desk text-muted"
            aria-hidden="true"
          >
            <User size={15} />
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-sm text-muted">
                Sign in
              </span>
              <ChevronsUpDown
                size={14}
                className="text-faint"
                aria-hidden="true"
              />
            </>
          )}
        </div>
        <button
          type="button"
          data-testid="sidebar-toggle"
          onClick={onToggleCollapsed}
          aria-pressed={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={
            collapsed
              ? "grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-desk hover:text-ink"
              : "flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-muted hover:bg-desk hover:text-ink"
          }
        >
          {collapsed ? (
            <PanelLeftOpen size={15} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={15} aria-hidden="true" />
          )}
          {!collapsed && (
            <span className="flex-1">{collapsed ? "Expand" : "Collapse"}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
