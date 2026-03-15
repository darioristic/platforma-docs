"use client";

import { Info, AlertTriangle, XCircle, Lightbulb } from "lucide-react";

const variants = {
  info: {
    icon: Info,
    borderColor: "border-l-[var(--primary)]",
    bg: "bg-[var(--primary)]/5",
    iconColor: "text-[var(--primary)]",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-l-amber-500",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-500",
  },
  error: {
    icon: XCircle,
    borderColor: "border-l-red-500",
    bg: "bg-red-500/5",
    iconColor: "text-red-500",
  },
  tip: {
    icon: Lightbulb,
    borderColor: "border-l-blue-500",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-500",
  },
};

export default function Callout({
  type = "info",
  children,
}: {
  type?: keyof typeof variants;
  children: React.ReactNode;
}) {
  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div
      className={`my-6 flex gap-3 rounded-r-lg border-l-4 ${variant.borderColor} ${variant.bg} p-4 not-prose`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${variant.iconColor}`} />
      <div className="text-sm leading-relaxed text-[var(--foreground)]">{children}</div>
    </div>
  );
}
