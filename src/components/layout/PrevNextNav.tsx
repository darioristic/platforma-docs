"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { navigation, flattenNavigation } from "@/lib/navigation";

export default function PrevNextNav() {
  const pathname = usePathname();
  const flat = flattenNavigation(navigation);
  const currentIndex = flat.findIndex((item) => item.href === pathname);

  if (currentIndex === -1) return null;

  const prev = currentIndex > 0 ? flat[currentIndex - 1] : null;
  const next = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;

  return (
    <div className="flex items-stretch gap-4 mt-12 pt-8 border-t border-[var(--border)]">
      {prev ? (
        <Link
          href={prev.href}
          className="flex-1 group flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          <div>
            <div className="text-xs text-[var(--muted-foreground)] mb-0.5">Previous</div>
            <div className="text-sm font-medium group-hover:text-[var(--primary)] transition-colors">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex-1 group flex items-center justify-end gap-3 p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-right"
        >
          <div>
            <div className="text-xs text-[var(--muted-foreground)] mb-0.5">Next</div>
            <div className="text-sm font-medium group-hover:text-[var(--primary)] transition-colors">
              {next.title}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
