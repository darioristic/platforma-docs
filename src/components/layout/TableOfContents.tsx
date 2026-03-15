"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside
      aria-label="Table of contents"
      className="w-[var(--toc-width)] shrink-0 h-[calc(100vh-var(--docs-header-height))] sticky top-[var(--docs-header-height)] py-6 px-4 overflow-y-auto hidden xl:block"
    >
      <h4 className="font-mono text-[11px] tracking-widest uppercase font-bold text-[var(--foreground)] mb-3">
        On this page
      </h4>
      <nav aria-label="On this page" className="space-y-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`block text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:rounded ${
              item.level === 3 ? "pl-3" : ""
            } ${
              activeId === item.id
                ? "text-[var(--primary)] font-medium"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
