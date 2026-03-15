"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (status >= 500) return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export default function ResponseExample({
  status,
  children,
}: {
  status: number;
  children: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const code = typeof children === "string" ? children.trim() : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 not-prose rounded-lg border border-[var(--code-border)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--muted)]">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">Response</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
            aria-label="Copy response body"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse response" : "Expand response"}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
          >
            <ChevronDown
              aria-hidden="true"
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            />
          </button>
        </div>
      </div>
      {isExpanded && (
        <pre className="p-4 overflow-x-auto bg-[var(--code-bg)] text-sm">
          <code className="font-mono text-[var(--foreground)]">{code}</code>
        </pre>
      )}
    </div>
  );
}
