// app/components/ui/Breadcrumb.tsx
"use client";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted mb-4">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="text-muted hover:text-accent">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="text-muted">/</span>}
        </span>
      ))}
    </nav>
  );
}