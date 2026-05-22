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
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#333] h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b border-[#333]">
        <h1 className="text-xl font-bold text-[#e8e6e3]">Skill Stacker</h1>
        <p className="text-sm text-[#666]">CV Builder</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === link.href
                    ? "bg-[#d4a85315] text-[#d4a853]"
                    : "text-[#8a8a8a] hover:bg-[#242424] hover:text-[#e8e6e3]"
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