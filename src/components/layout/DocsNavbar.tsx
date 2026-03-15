"use client";

import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";

export default function DocsNavbar({
  onMenuToggle,
  onSearchOpen,
}: {
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      {/* Left: Logo + Docs badge */}
      <div className="flex items-center gap-3">
        <button
          className="xl:hidden p-1.5 -ml-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            onMenuToggle?.();
          }}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>

        <Link href="/" aria-label="PLATFORMA Docs home" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded">
          <div className="w-5 h-5 border-2 border-[#00cf60] dark:border-[#01FF77] relative" aria-hidden="true">
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#00cf60] dark:bg-[#01FF77]" />
          </div>
          <span className="text-lg font-bold tracking-tight uppercase">
            PLATFORMA
          </span>
        </Link>

        <span className="text-[10px] font-mono tracking-wider text-[var(--muted-foreground)] uppercase border border-[var(--border)] rounded px-2 py-0.5" aria-hidden="true">
          Docs
        </span>
      </div>

      {/* Right: Links + Search */}
      <div className="flex items-center gap-4 text-sm">
        <a
          href="https://platforma.cloud"
          rel="noopener noreferrer"
          className="hidden sm:block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
        >
          Home
        </a>
        <a
          href="https://platforma.cloud/support"
          rel="noopener noreferrer"
          className="hidden sm:block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
        >
          Support
        </a>

        <button
          onClick={onSearchOpen}
          aria-label="Search documentation"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] text-sm hover:border-[var(--muted-foreground)] transition-colors w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="flex-1 text-left">Search docs…</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)]">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </button>

        <button
          onClick={onSearchOpen}
          className="md:hidden p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
          aria-label="Search documentation"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
