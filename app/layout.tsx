import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PanelIQ",
  description: "Hardware part library and OP build tool",
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
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap" style={{ padding: "12px 24px", gap: 12 }}>
            <Link href="/library" className="flex items-center" style={{ gap: 10 }}>
              <Image
                src="/logo.png"
                alt="Maris Systems Design"
                width={449}
                height={101}
                priority
                // The PNG ships with a white background; multiply drops it onto the page fill.
                style={{ height: 30, width: "auto", mixBlendMode: "multiply" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                hardware part library &amp; OP build
              </span>
            </Link>
          </div>
        </header>
        <TabBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
