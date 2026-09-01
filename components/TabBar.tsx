"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/library", label: "Hardware Library" },
  { href: "/datasheets", label: "Datasheets & Manuals" },
  { href: "/cad", label: "CAD Files" },
  { href: "/images", label: "Device Images" },
  { href: "/jobs", label: "Jobs" },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap" style={{ padding: "0 24px", gap: 4 }}>
        {TABS.map((tab) => {
          // "Hardware Library" stays active across its family pages; "Jobs" across OP Build.
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 14px",
                marginBottom: -1,
                borderBottom: "2px solid transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                borderBottomColor: active ? "var(--primary)" : "transparent",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
