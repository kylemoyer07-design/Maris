"use client";

import PartCard, { PartUsage } from "@/components/PartCard";
import { Part } from "@/lib/types";

/** Collapsible brand group — used by the library hub search and family pages. */
export default function BrandGroup({
  brand,
  list,
  usage,
  collapsed,
  onToggle,
}: {
  brand: string;
  list: Part[];
  usage: Record<string, PartUsage[]>;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center"
        style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.025em",
            color: "var(--text-muted)",
          }}
        >
          {brand}
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {list.length}
        </span>
      </button>
      {!collapsed && (
        <div className="flex flex-col" style={{ gap: 8, padding: "8px 0" }}>
          {list.map((part) => (
            <PartCard key={part.id} part={part} usage={usage[part.id] || []} />
          ))}
        </div>
      )}
    </div>
  );
}
