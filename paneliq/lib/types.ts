export type Category = "special" | "sensor" | "pneumatic";

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

export const CATEGORY_LABEL: Record<Category, string> = {
  special: "Special",
  sensor: "Sensor",
  pneumatic: "Pneumatic / Hydraulic",
};

export const VALVES_PER_BANK = 6;
export const SENSOR_PTS_PER_BANK = 16;
export const SHEETS_PER_BANK = 6;
