"use client";

import Link from "next/link";
import { CATEGORY_LABEL, CATEGORY_TO_FAMILY, Part } from "@/lib/types";

export interface PartUsage {
  opNumber: string;
  quantity: number;
}

export default function PartCard({ part, usage }: { part: Part; usage: PartUsage[] }) {
  // voltage · signal · operate · pins · HP · RPM · Cable P/N · additional info
  const spec = [
    part.voltage,
    part.signal,
    part.operate,
    part.pins ? `${part.pins} pin` : null,
    part.hp,
    part.rpm,
    part.cable_pn ? `Cable P/N: ${part.cable_pn}` : null,
    part.addl_switch,
    part.addl_cable,
  ]
    .filter(Boolean)
    .join(" · ");

  const used = usage.length
    ? usage.map((u) => `${u.opNumber} ×${u.quantity}`).join(", ")
    : null;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
          {part.part_number}
        </span>
        <span className={`pill ${part.category}`}>{CATEGORY_LABEL[part.category]}</span>
        {part.safety && <span className="pill safety">Safety</span>}
        {part.comm && <span className="pill special">Comm</span>}
        {/* Synthetic UNCAT- key — must never read as a real catalogued number. */}
        {part.provisional_part_number && (
          <span className="pill safety" title="Placeholder key — real part number still lives in mechanical's BOM">
            Uncatalogued P/N
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>
        {part.brand || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Brand not recorded</span>}
        {part.type && <span style={{ fontWeight: 400, color: "var(--text-muted)" }}> {part.type}</span>}
      </div>

      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        {spec || "No spec fields on file yet"}
      </div>

      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        I/O: {part.std_in}/{part.std_out} std, {part.safe_in}/{part.safe_out} safety
        {used ? ` · used in ${used}` : " · not used in an OP yet"}
      </div>

      <div className="flex flex-wrap" style={{ gap: 16, marginTop: 8, fontSize: 12, fontWeight: 600 }}>
        {part.datasheet_path ? (
          <Link href={`/datasheets?q=${encodeURIComponent(part.part_number)}`} style={{ color: "var(--primary)" }}>
            Datasheet
          </Link>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>No datasheet on file</span>
        )}
        {part.cad_path ? (
          <Link href={`/cad?q=${encodeURIComponent(part.part_number)}`} style={{ color: "var(--primary)" }}>
            CAD file
          </Link>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>No CAD file on file</span>
        )}
        <Link href={`/library/${CATEGORY_TO_FAMILY[part.category]}`} style={{ color: "var(--primary)" }}>
          {CATEGORY_LABEL[part.category]} family
        </Link>
      </div>
    </div>
  );
}
