import Link from "next/link";

/**
 * Shell for the storage screens (`/datasheets`, `/cad`, `/images`) that are
 * specified in design_handoff_paneliq/README.md but not built yet. Renders the
 * real page chrome so the tab bar doesn't lead anywhere broken, and says plainly
 * that the screen is still to come rather than faking an empty data state.
 */
export default function PlaceholderPage({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="max-w-5xl mx-auto" style={{ padding: "32px 24px" }}>
      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
        <Link href="/library" style={{ color: "var(--primary)" }}>
          Hardware Library
        </Link>
        <span> / </span>
        <span style={{ color: "var(--text)" }}>{title}</span>
      </div>

      <h1 className="display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 4 }}>
        {title}
      </h1>

      <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 780, margin: "0 0 20px" }}>
        {blurb}
      </p>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Not built yet</div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 620, margin: 0 }}>
          This screen is specified in the design handoff and comes with the part-library
          migration. The tab above is live so the navigation is complete; the file list lands
          once the <span className="mono">parts</span> and{" "}
          <span className="mono">device_images</span> tables exist.
        </p>
      </div>
    </div>
  );
}
