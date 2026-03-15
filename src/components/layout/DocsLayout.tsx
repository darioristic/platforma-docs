"use client";

import { useState } from "react";
import DocsNavbar from "./DocsNavbar";
import DocsFooter from "./DocsFooter";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <DocsNavbar
        onMenuToggle={() => setMobileNavOpen(!mobileNavOpen)}
        onSearchOpen={() => {
          // Search will be wired up later
          const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
          document.dispatchEvent(event);
        }}
      />

      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex flex-1 pt-16">
        {/* Desktop sidebar */}
        <Sidebar className="hidden xl:block" />

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      <DocsFooter />
    </div>
  );
}
