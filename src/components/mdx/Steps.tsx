import { Children } from "react";

export function Steps({ children }: { children: React.ReactNode }) {
  const childArray = Children.toArray(children);

  return (
    <div className="my-6 not-prose space-y-0">
      {childArray.map((child, index) => (
        <div key={index} className="flex gap-4">
          {/* Vertical line + number */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0">
              {index + 1}
            </div>
            {index < childArray.length - 1 && (
              <div className="w-px flex-1 bg-[var(--primary)]/20 my-1" />
            )}
          </div>
          {/* Content */}
          <div className="pb-8 flex-1 min-w-0">{child}</div>
        </div>
      ))}
    </div>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-2 mt-0.5">{title}</h3>
      <div className="text-sm text-[var(--muted-foreground)] leading-relaxed prose dark:prose-invert prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
}
