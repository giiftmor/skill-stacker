// app/components/ui/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  cvId?: number;
}

export default function Sidebar({ cvId }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/cvs", label: "My CVs", icon: "📋" },
    ...(cvId ? [
      { href: `/cvs/${cvId}/edit`, label: "Edit CV", icon: "✏️" },
      { href: `/cvs/${cvId}/preview`, label: "Preview", icon: "👁️" },
    ] : []),
  ];

  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">Skill Stacker</h1>
        <p className="text-sm text-gray-500">CV Builder</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === link.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}