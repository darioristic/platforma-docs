export function ParamTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 not-prose border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

export function Param({
  name,
  type,
  required,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <code className="text-sm font-mono font-medium text-[var(--foreground)]">{name}</code>
        <span className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
          {type}
        </span>
        {required && (
          <span className="text-[10px] font-mono font-bold uppercase text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">
            Required
          </span>
        )}
      </div>
      <div className="text-sm text-[var(--muted-foreground)] leading-relaxed">{children}</div>
    </div>
  );
}
