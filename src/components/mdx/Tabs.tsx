"use client";

import { useState, Children, useId } from "react";

export function Tabs({
  items,
  children,
}: {
  items: string[];
  children: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const childArray = Children.toArray(children);
  const id = useId();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((index + 1) % items.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((index - 1 + items.length) % items.length);
    }
  };

  return (
    <div className="my-6 not-prose rounded-lg border border-[var(--border)] overflow-hidden">
      <div
        role="tablist"
        aria-label="Code examples"
        className="flex border-b border-[var(--border)] bg-[var(--muted)] overflow-x-auto"
      >
        {items.map((item, index) => (
          <button
            key={item}
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={activeIndex === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] ${
              activeIndex === index
                ? "text-[var(--primary)] border-[var(--primary)]"
                : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-${activeIndex}`}
        aria-labelledby={`${id}-tab-${activeIndex}`}
        className="p-0"
      >
        {childArray[activeIndex]}
      </div>
    </div>
  );
}

export function Tab({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
