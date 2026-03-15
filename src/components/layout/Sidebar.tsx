"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { navigation, type NavItem, type NavSection } from "@/lib/navigation";

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = item.href === pathname;
  const [isOpen, setIsOpen] = useState(() => {
    if (!item.items) return false;
    return item.items.some((child) => {
      if (child.href === pathname) return true;
      return child.items?.some((grandchild) => grandchild.href === pathname);
    });
  });

  if (item.items) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center justify-between w-full py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:rounded"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <span className="font-medium">{item.title}</span>
          <ChevronRight
            aria-hidden="true"
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="mt-0.5" role="group" aria-label={item.title}>
            {item.items.map((child) => (
              <NavLink key={child.title} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      aria-current={isActive ? "page" : undefined}
      className={`block py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:rounded ${
        isActive
          ? "text-[var(--primary)] font-medium border-l-2 border-[var(--primary)] bg-[var(--primary)]/5"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-l-2 border-transparent"
      }`}
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
    >
      {item.title}
    </Link>
  );
}

function NavSectionGroup({ section }: { section: NavSection }) {
  return (
    <div className="mb-6">
      <h4 className="font-mono text-[11px] tracking-widest uppercase font-bold text-[var(--foreground)] mb-2 px-0">
        {section.title}
      </h4>
      <nav aria-label={section.title} className="space-y-0.5">
        {section.items.map((item) => (
          <NavLink key={item.title} item={item} />
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label="Documentation navigation"
      className={`w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border)] overflow-y-auto h-[calc(100vh-var(--docs-header-height))] sticky top-[var(--docs-header-height)] py-6 px-4 ${className}`}
    >
      {navigation.map((section) => (
        <NavSectionGroup key={section.title} section={section} />
      ))}
    </aside>
  );
}
