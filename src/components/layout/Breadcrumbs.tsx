"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return { label, href };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mb-6">
      <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
        Docs
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          {index === crumbs.length - 1 ? (
            <span className="text-[var(--foreground)] font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-[var(--foreground)] transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
