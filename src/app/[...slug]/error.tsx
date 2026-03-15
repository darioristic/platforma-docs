"use client";

import Link from "next/link";

export default function DocError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-[var(--muted-foreground)] mb-6 text-sm">
          An error occurred while loading this page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            Go to docs home
          </Link>
        </div>
      </div>
    </div>
  );
}
