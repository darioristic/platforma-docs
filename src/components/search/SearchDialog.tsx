"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, ArrowRight, Hash, BookOpen } from "lucide-react";
import type { SearchEntry, ScoredResult } from "@/lib/search-client";
import { searchEntries } from "@/lib/search-client";

const matchIcons: Record<string, typeof FileText> = {
  title: FileText,
  heading: Hash,
  description: BookOpen,
  body: FileText,
  keyword: FileText,
};

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScoredResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load search index on first open
  useEffect(() => {
    if (!isOpen || indexLoaded) return;

    fetch("/api/search")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setIndex(data);
        setIndexLoaded(true);
      })
      .catch(() => {
        // Silently fail — search will show no results
      });
  }, [isOpen, indexLoaded]);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (!q.trim()) {
        setResults([]);
        setActiveIndex(0);
        return;
      }
      const scored = searchEntries(index, q);
      setResults(scored);
      setActiveIndex(0);
    },
    [index]
  );

  const handleSelect = useCallback(
    (href: string) => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      handleSelect(results[activeIndex].entry.href);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        className="fixed inset-x-0 top-[15vh] z-[101] mx-auto max-w-lg px-4"
      >
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
            <Search className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyNavigation}
              placeholder="Search documentation…"
              className="flex-1 py-3.5 text-sm bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
              aria-label="Search documentation"
              aria-autocomplete="list"
              aria-controls="search-results"
              role="combobox"
              aria-expanded={results.length > 0}
              spellCheck={false}
            />
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
              aria-label="Close search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Results */}
          <div id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto" aria-live="polite">
            {query && results.length === 0 && indexLoaded && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {query && !indexLoaded && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Loading…
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = matchIcons[result.matchType] ?? FileText;
                  return (
                    <button
                      key={result.entry.href}
                      role="option"
                      aria-selected={index === activeIndex}
                      onClick={() => handleSelect(result.entry.href)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] ${
                        index === activeIndex
                          ? "bg-[var(--muted)] text-[var(--foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{result.entry.title}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">
                          {result.entry.section}
                          {result.matchType === "heading" && (
                            <span className="ml-1 text-[var(--primary)]">
                              — matched heading
                            </span>
                          )}
                          {result.matchType === "body" && (
                            <span className="ml-1">
                              — matched in content
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-50" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            )}

            {!query && (
              <div className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
                Type to search across all documentation
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--muted)]">&#8593;&#8595;</kbd>
              <span>Navigate</span>
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--muted)]">&#9166;</kbd>
              <span>Select</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--muted)]">Esc</kbd>
              <span className="ml-1">Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
