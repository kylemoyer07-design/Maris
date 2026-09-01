import { supabase } from "@/lib/supabase";
import { NO_BRAND, Part } from "@/lib/types";
import type { PartUsage } from "@/components/PartCard";

export interface PartsData {
  parts: Part[];
  /** part id -> the OPs that pull it in, aggregated by OP number. */
  usage: Record<string, PartUsage[]>;
  imageCount: number;
}

interface OpDeviceUsageRow {
  part_id: string | null;
  quantity: number | null;
  ops: { op_number: string } | { op_number: string }[] | null;
}

/** Loads the whole library plus per-part OP usage. Small table; one round trip each. */
export async function loadPartsWithUsage(): Promise<PartsData> {
  const [{ data: parts }, { data: rows }, { count }] = await Promise.all([
    supabase.from("parts").select("*"),
    supabase.from("op_devices").select("part_id, quantity, ops(op_number)"),
    supabase.from("device_images").select("*", { count: "exact", head: true }),
  ]);

  const usage: Record<string, PartUsage[]> = {};
  ((rows as OpDeviceUsageRow[]) || []).forEach((row) => {
    if (!row.part_id) return;
    // PostgREST returns the embedded row as an object or an array depending on
    // how it infers the relationship; normalise both.
    const op = Array.isArray(row.ops) ? row.ops[0] : row.ops;
    if (!op) return;
    // ops.op_number is stored bare ("230"); the UI labels OPs as "OP230".
    const label = /^op/i.test(op.op_number) ? op.op_number : `OP${op.op_number}`;
    const list = (usage[row.part_id] ||= []);
    const existing = list.find((u) => u.opNumber === label);
    if (existing) existing.quantity += row.quantity || 1;
    else list.push({ opNumber: label, quantity: row.quantity || 1 });
  });

  Object.values(usage).forEach((list) => list.sort((a, b) => a.opNumber.localeCompare(b.opNumber)));

  return { parts: (parts as Part[]) || [], usage, imageCount: count || 0 };
}

/** Part numbers sort naturally, so "PN10" lands after "PN9". */
export function byPartNumber(a: Part, b: Part) {
  return a.part_number.localeCompare(b.part_number, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function matchesPart(part: Part, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [part.part_number, part.brand, part.type, part.category]
    .filter(Boolean)
    .some((field) => (field as string).toLowerCase().includes(q));
}

/** Groups parts by brand, brands alphabetical, parts by part number. */
export function groupByBrand(parts: Part[]): [string, Part[]][] {
  const map = new Map<string, Part[]>();
  parts.forEach((p) => {
    const key = p.brand?.trim() || NO_BRAND;
    const list = map.get(key);
    if (list) list.push(p);
    else map.set(key, [p]);
  });
  return [...map.entries()]
    .sort((a, b) => {
      // Parts with no brand recorded sort last, not under "B".
      if (a[0] === NO_BRAND) return 1;
      if (b[0] === NO_BRAND) return -1;
      return a[0].localeCompare(b[0]);
    })
    .map(([brand, list]) => [brand, list.sort(byPartNumber)] as [string, Part[]]);
}
