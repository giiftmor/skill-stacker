// app/components/ui/Breadcrumb.tsx
"use client";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  currentClassName?: string;
}

export default function Breadcrumb({
  items,
  className = "",
  currentClassName = "",
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm text-muted ${className}`}
    >
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <span key={index} className="flex min-w-0 items-center gap-2">
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted hover:text-accent"
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`font-medium text-ink ${currentClassName}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isCurrent && <span className="text-faint">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
