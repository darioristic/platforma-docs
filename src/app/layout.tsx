import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SearchDialog from "@/components/search/SearchDialog";
import SkipNav from "@/components/layout/SkipNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://docs.platforma.cloud";

export const metadata: Metadata = {
  title: {
    default: "PLATFORMA Docs — Guides, APIs & Technical References",
    template: "%s — PLATFORMA Docs",
  },
  description:
    "Documentation for PLATFORMA Cloud Control and Billing Platform. API references, guides, tutorials, and architecture documentation.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PLATFORMA Docs",
    title: "PLATFORMA Docs — Guides, APIs & Technical References",
    description:
      "Documentation for PLATFORMA Cloud Control and Billing Platform. API references, guides, tutorials, and architecture documentation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PLATFORMA Docs",
    description:
      "Guides, API references, and technical documentation for the Cloud Control and Billing Platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <ThemeProvider>
          <SkipNav />
          {children}
          <SearchDialog />
        </ThemeProvider>
      </body>
    </html>
  );
}
