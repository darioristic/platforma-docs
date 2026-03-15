import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-[var(--primary)] mb-4">404</p>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-[var(--muted-foreground)] mb-6 text-sm">
          The documentation page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        >
          Back to docs home
        </Link>
      </div>
    </div>
  );
}
