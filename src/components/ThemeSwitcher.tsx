"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Monitor, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const { setTheme } = useTheme();
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">("dark");
  const [mode, setMode] = useState<"system" | "light" | "dark">("system");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPreference(mq.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
      if (mode === "system") {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, setTheme]);

  const handleChange = (newMode: "system" | "light" | "dark") => {
    setMode(newMode);
    if (newMode === "system") {
      setTheme(systemPreference);
    } else {
      setTheme(newMode);
    }
  };

  const options = [
    { value: "system" as const, icon: Monitor, label: "System" },
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
  ];

  return (
    <div className="inline-flex items-center rounded-full border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-0.5 gap-0.5">
      {options.map((opt) => {
        const isActive = mode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className={`p-1 rounded-full transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-white/15 text-black dark:text-white shadow-sm"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
            aria-label={opt.label}
            title={opt.label}
          >
            <opt.icon className="w-3 h-3" />
          </button>
        );
      })}
    </div>
  );
}
