import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PanelIQ",
  description: "Hardware device library and OP build tool",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <header
          className="border-b-2"
          style={{ borderColor: "var(--text)", background: "var(--bg)" }}
        >
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="display font-extrabold text-xl" style={{ letterSpacing: "-0.01em" }}>
                Panel<span style={{ color: "var(--primary)" }}>IQ</span>
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                hardware device library &amp; OP build
              </span>
            </Link>
            <nav className="flex gap-5 text-sm font-semibold">
              <Link href="/library" style={{ color: "var(--text)" }}>
                Hardware Library
              </Link>
              <Link href="/jobs" style={{ color: "var(--text)" }}>
                Jobs
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
