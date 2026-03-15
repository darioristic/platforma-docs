import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Code,
  Lock,
  Server,
  BookOpen,
  Layers,
  Database,
  Shield,
  Receipt,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Zap,
  Code,
  Lock,
  Server,
  BookOpen,
  Layers,
  Database,
  Shield,
  Receipt,
  ArrowRight,
};

export function CardGrid({
  cols = 2,
  children,
}: {
  cols?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`my-6 not-prose grid gap-4 ${
        cols === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : cols === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
      {children}
    </div>
  );
}

export function Card({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon?: string;
  children?: React.ReactNode;
}) {
  const IconComponent = icon ? iconMap[icon] ?? null : null;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
    >
      <div className="flex items-center gap-2">
        {IconComponent && (
          <IconComponent className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
        )}
        <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
          {title}
        </h3>
        <ArrowRight
          aria-hidden="true"
          className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
        />
      </div>
      {children && (
        <div className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {children}
        </div>
      )}
    </Link>
  );
}
