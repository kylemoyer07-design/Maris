// Category is the *part's* physical identity, never the device name it gets in
// a job. "Robot 1 Load Rail PRX" is a proximity sensor, so its part lives under
// `sensor` — the robot association belongs to the OP instance, not the library.
export type Category = "special" | "sensor" | "pneumatic" | "robot";

/** URL segment for a library family. */
export type Family = "electrical" | "pneumatic" | "special" | "robots";

export const FAMILY_TO_CATEGORY: Record<Family, Category> = {
  electrical: "sensor",
  pneumatic: "pneumatic",
  special: "special",
  robots: "robot",
};

export const CATEGORY_TO_FAMILY: Record<Category, Family> = {
  sensor: "electrical",
  pneumatic: "pneumatic",
  special: "special",
  robot: "robots",
};

export const FAMILY_ORDER: Family[] = ["electrical", "pneumatic", "special", "robots"];

export const FAMILY_LABEL: Record<Family, string> = {
  electrical: "Electrical",
  pneumatic: "Pneumatic / Hydraulic",
  special: "Special Devices",
  robots: "Robots",
};

export const FAMILY_BLURB: Record<Family, string> = {
  electrical: "Proximity switches, photoeyes and other sensing devices.",
  pneumatic: "Cylinders, valves and manifold-driven actuators.",
  special: "Devices that do not sit on a valve bank or sensor block.",
  robots: "Robot arms, controllers and their dedicated hardware.",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  special: "Special",
  sensor: "Electrical",
  pneumatic: "Pneumatic / Hydraulic",
  robot: "Robot",
};

/** Group label for parts with no brand recorded yet. */
export const NO_BRAND = "Brand not recorded";

/**
 * A catalogued part — one row per part number, no device names or stations.
 * `provisional_part_number` marks a synthetic `UNCAT-` key standing in for a
 * real number from mechanical's BOM; show these as uncatalogued, never as fact.
 */
export interface Part {
  id: string;
  part_number: string;
  provisional_part_number: boolean;
  brand: string | null;
  category: Category;
  type: string | null;
  voltage: string | null;
  signal: string | null;
  operate: string | null;
  hp: string | null;
  rpm: string | null;
  cable_pn: string | null;
  pins: string | null;
  addl_switch: string | null;
  addl_cable: string | null;
  safety: boolean;
  comm: boolean;
  std_in: number;
  std_out: number;
  safe_in: number;
  safe_out: number;
  cut_sheet: string | null;
  controls_info: string | null;
  notes: string | null;
  datasheet_path: string | null;
  cad_path: string | null;
  image_id: string | null;
  created_at: string;
}

export interface DeviceImage {
  id: string;
  name: string;
  symbol: string;
  kind: string;
  path: string | null;
  created_at: string;
}

/** A part named for one OP. Names, stations and cable tags live here. */
export interface OpDeviceInstance {
  id: string;
  op_id: string;
  part_id: string | null;
  name: string | null;
  station: string | null;
  cable_tag: string | null;
  quantity: number;
  sort_order: number | null;
}

// ---------------------------------------------------------------------------
// Pre-redesign shapes. Still used by the pages that have not been rebuilt yet;
// `devices` remains in the database untouched behind the new `parts` table.
// ---------------------------------------------------------------------------

export interface Device {
  id: string;
  name: string;
  station: string | null;
  category: Category;
  part_number: string | null;
  cable_number: string | null;
  cut_sheet_link: string | null;
  safety: boolean;
  comm: boolean;
  revision_note: string | null;
  std_in: number;
  std_out: number;
  safe_in: number;
  safe_out: number;
  io_note: string | null;
  spec: Record<string, string>;
  ctrl: { valveBank?: string; module?: string; addresses?: { addr: string; label: string }[] } | null;
  datasheet_path: string | null;
  cad_path: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  job_number: string;
  job_name: string | null;
  customer: string | null;
}

export interface Op {
  id: string;
  job_id: string;
  op_number: string;
  name: string | null;
}

export interface OpDevice {
  id: string;
  op_id: string;
  device_id: string;
  quantity: number;
}

export const VALVES_PER_BANK = 6;
export const SENSOR_PTS_PER_BANK = 16;
export const SHEETS_PER_BANK = 6;
