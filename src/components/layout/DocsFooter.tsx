import ThemeSwitcher from "@/components/ThemeSwitcher";

const footerLinks = [
  { label: "Home", href: "https://platforma.cloud" },
  { label: "Platform", href: "https://platforma.cloud/platform" },
  { label: "Support", href: "https://platforma.cloud/support" },
  { label: "Contact", href: "https://platforma.cloud/contact" },
];

export default function DocsFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-8 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#00cf60] dark:border-[#01FF77] relative" aria-hidden="true">
            <div className="absolute top-0 right-0 w-1 h-1 bg-[#00cf60] dark:bg-[#01FF77]" />
          </div>
          <span className="font-bold tracking-tight uppercase text-[var(--foreground)]">
            PLATFORMA
          </span>
          <span className="text-[var(--muted-foreground)]">Docs</span>
        </div>

        <nav aria-label="Footer navigation" className="flex items-center gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <p>&copy; {new Date().getFullYear()} PLATFORMA.</p>
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
