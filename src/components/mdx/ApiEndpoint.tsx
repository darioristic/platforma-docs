import { Lock } from "lucide-react";

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ApiEndpoint({
  method,
  path,
  auth,
  children,
}: {
  method: string;
  path: string;
  auth?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="my-6 not-prose rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--muted)]">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${
            methodColors[method] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"
          }`}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-[var(--foreground)]">{path}</code>
        {auth && (
          <span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Lock className="w-3 h-3" />
            {auth}
          </span>
        )}
      </div>
      {children && (
        <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{children}</div>
      )}
    </div>
  );
}
