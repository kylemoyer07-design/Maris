import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--primary)" }}>
        Hardware Design
      </div>
      <h1 className="display text-4xl font-extrabold mb-4" style={{ letterSpacing: "-0.01em" }}>
        One device library. Every job pulls from it.
      </h1>
      <p className="text-base leading-relaxed max-w-2xl mb-10" style={{ color: "var(--text-muted)" }}>
        Catalog a part once — spec, datasheet, CAD block, I/O — and pull it into any job&apos;s OP from
        here on. No more redrawing the same light curtain, cylinder, or photoeye every time it shows
        up on a new machine.
      </p>
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/library"
          className="rounded-lg px-5 py-3 font-bold text-sm text-white"
          style={{ background: "var(--primary)" }}
        >
          Open Hardware Library
        </Link>
        <Link
          href="/jobs"
          className="rounded-lg px-5 py-3 font-bold text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          Browse Jobs &amp; OPs
        </Link>
      </div>
    </div>
  );
}
