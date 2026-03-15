"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CodeBlock({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const code = extractTextContent(children);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre {...props}>{children}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-[var(--muted)] border border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractTextContent).join("");
  if (typeof node === "object" && "props" in node) {
    return extractTextContent((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}
