const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Badge({
  variant = "default",
  children,
}: {
  variant?: string;
  children: React.ReactNode;
}) {
  const colors =
    methodColors[variant.toUpperCase()] ??
    "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${colors}`}
    >
      {children}
    </span>
  );
}
