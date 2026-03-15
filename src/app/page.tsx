"use client";

import Link from "next/link";
import { Zap, Code, BookOpen, Layers, Search, ArrowRight } from "lucide-react";
import DocsNavbar from "@/components/layout/DocsNavbar";
import DocsFooter from "@/components/layout/DocsFooter";

const sections = [
  {
    title: "Getting Started",
    description: "Quick setup guide, authentication, and your first API call in under 5 minutes.",
    href: "/getting-started/introduction",
    icon: Zap,
    color: "text-[var(--primary)]",
  },
  {
    title: "API Reference",
    description: "Complete REST API documentation with endpoints, parameters, and response examples.",
    href: "/api-reference/overview",
    icon: Code,
    color: "text-blue-400",
  },
  {
    title: "Guides",
    description: "Step-by-step tutorials for billing, infrastructure deployment, and integrations.",
    href: "/guides/setup-first-service",
    icon: BookOpen,
    color: "text-amber-400",
  },
  {
    title: "Architecture",
    description: "Platform architecture, data models, event bus, multi-tenancy, and security.",
    href: "/architecture/overview",
    icon: Layers,
    color: "text-purple-400",
  },
];

const popularPages = [
  { title: "Quickstart", href: "/getting-started/quickstart" },
  { title: "Authentication", href: "/api-reference/authentication" },
  { title: "Create Order", href: "/api-reference/orders/create-order" },
  { title: "Deploy Infrastructure", href: "/guides/deploy-infrastructure" },
  { title: "Platform Layers", href: "/architecture/platform-layers" },
  { title: "Event Bus", href: "/architecture/event-bus" },
];

export default function DocsHome() {
  return (
    <div className="min-h-screen flex flex-col">
      <DocsNavbar />

      <main id="main-content" className="flex-1 pt-16">
        {/* Hero */}
        <section className="px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              PLATFORMA{" "}
              <span className="text-[var(--primary)]">Documentation</span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto">
              Guides, API references, and technical documentation for the Cloud Control and Billing Platform.
            </p>

            {/* Search */}
            <button
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
                );
              }}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] transition-colors w-full max-w-md mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="flex-1 text-left text-sm">Search documentation…</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-mono text-[var(--muted-foreground)]">
                <span>&#8984;</span>K
              </kbd>
            </button>
          </div>
        </section>

        {/* Section Cards */}
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section) => (
              <Link
                key={section.title}
                href={section.href}
                className="group flex flex-col gap-3 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <div className="flex items-center gap-3">
                  <section.icon className={`w-6 h-6 ${section.color}`} aria-hidden="true" />
                  <h2 className="text-lg font-semibold group-hover:text-[var(--primary)] transition-colors">
                    {section.title}
                  </h2>
                  <ArrowRight aria-hidden="true" className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {section.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Pages */}
        <section className="px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-mono text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-4">
              Popular Pages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {popularPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <span className="text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {page.title}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[var(--muted-foreground)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <DocsFooter />
    </div>
  );
}
