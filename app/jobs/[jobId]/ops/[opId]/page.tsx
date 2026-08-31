"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CATEGORY_LABEL,
  Device,
  Job,
  Op,
  OpDevice,
  SENSOR_PTS_PER_BANK,
  SHEETS_PER_BANK,
  VALVES_PER_BANK,
} from "@/lib/types";

export default function OpPage() {
  const params = useParams<{ jobId: string; opId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [opDevices, setOpDevices] = useState<OpDevice[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: j }, { data: o }, { data: d }, { data: od }] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", params.jobId).single(),
      supabase.from("ops").select("*").eq("id", params.opId).single(),
      supabase.from("devices").select("*").order("station").order("name"),
      supabase.from("op_devices").select("*").eq("op_id", params.opId),
    ]);
    setJob(j as Job);
    setOp(o as Op);
    setDevices((d as Device[]) || []);
    setOpDevices((od as OpDevice[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.opId]);

  async function addDevice(deviceId: string) {
    const existing = opDevices.find((od) => od.device_id === deviceId);
    if (existing) {
      await supabase.from("op_devices").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("op_devices").insert({ op_id: params.opId, device_id: deviceId, quantity: 1 });
    }
    load();
  }
  async function decDevice(od: OpDevice) {
    if (od.quantity <= 1) {
      await supabase.from("op_devices").delete().eq("id", od.id);
    } else {
      await supabase.from("op_devices").update({ quantity: od.quantity - 1 }).eq("id", od.id);
    }
    load();
  }
  async function removeDevice(od: OpDevice) {
    await supabase.from("op_devices").delete().eq("id", od.id);
    load();
  }

  const filteredLibrary = useMemo(() => {
    const f = search.toLowerCase();
    if (!f) return devices;
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(f) ||
        (d.station || "").toLowerCase().includes(f) ||
        (d.part_number || "").toLowerCase().includes(f)
    );
  }, [devices, search]);

  const rollup = useMemo(() => {
    let stdIn = 0,
      stdOut = 0,
      safeIn = 0,
      safeOut = 0,
      pneumaticQty = 0,
      sensorQty = 0,
      deviceCount = 0;
    opDevices.forEach((od) => {
      const d = devices.find((x) => x.id === od.device_id);
      if (!d) return;
      const q = od.quantity;
      stdIn += d.std_in * q;
      stdOut += d.std_out * q;
      safeIn += d.safe_in * q;
      safeOut += d.safe_out * q;
      deviceCount += q;
      if (d.category === "pneumatic") pneumaticQty += q;
      if (d.category === "sensor") sensorQty += q;
    });
    const banksForValves = Math.ceil(pneumaticQty / VALVES_PER_BANK) || 0;
    const banksForSensors = Math.ceil(sensorQty / SENSOR_PTS_PER_BANK) || 0;
    const banks = pneumaticQty || sensorQty ? Math.max(banksForValves, banksForSensors, 1) : 0;
    const sheets = banks * SHEETS_PER_BANK;
    return { stdIn, stdOut, safeIn, safeOut, pneumaticQty, sensorQty, banks, sheets, deviceCount };
  }, [opDevices, devices]);

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-8 text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h1 className="display text-2xl font-extrabold">
          {job?.job_name} — OP{op?.op_number}
        </h1>
        <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>
          {op?.name}
        </span>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        Pull devices from the shared Hardware Library into this OP.
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-sm">Hardware Library</h2>
            <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>{devices.length} devices</span>
          </div>
          <div className="p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library…"
              className="w-full px-3 py-2 rounded-md border text-sm mb-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            />
            <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2">
              {filteredLibrary.map((d) => (
                <div key={d.id} className="rounded-md border p-2.5 flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                      {d.name}
                      <span className={`pill ${d.category}`}>{CATEGORY_LABEL[d.category]}</span>
                    </div>
                    <div className="mono text-xs" style={{ color: "var(--text-muted)" }}>{d.station}</div>
                  </div>
                  <button
                    onClick={() => addDevice(d.id)}
                    className="rounded-md px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap"
                    style={{ background: "var(--primary)" }}
                  >
                    + Add
                  </button>
                </div>
              ))}
              {filteredLibrary.length === 0 && (
                <div className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>
                  No matches. Catalog it in the Hardware Library first.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-sm">
              OP{op?.op_number} Build
            </h2>
            <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>{rollup.deviceCount} devices added</span>
          </div>
          <div className="p-3">
            <div className="flex flex-col gap-2 mb-4">
              {opDevices.length === 0 && (
                <div className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>
                  Add devices from the library to see live rollup totals.
                </div>
              )}
              {opDevices.map((od) => {
                const d = devices.find((x) => x.id === od.device_id);
                if (!d) return null;
                return (
                  <div key={od.id} className="flex items-center justify-between gap-2 py-1.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="mono text-xs" style={{ color: "var(--text-muted)" }}>{d.station}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => decDevice(od)} className="w-6 h-6 rounded border text-xs" style={{ borderColor: "var(--border)" }}>
                        −
                      </button>
                      <span className="mono text-sm w-4 text-center">{od.quantity}</span>
                      <button onClick={() => addDevice(od.device_id)} className="w-6 h-6 rounded border text-xs" style={{ borderColor: "var(--border)" }}>
                        +
                      </button>
                      <button onClick={() => removeDevice(od)} className="text-lg px-1" style={{ color: "var(--text-muted)" }}>
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Stat label="Std inputs" value={rollup.stdIn} />
              <Stat label="Std outputs" value={rollup.stdOut} />
              <Stat label="Safety inputs" value={rollup.safeIn} accent />
              <Stat label="Safety outputs" value={rollup.safeOut} accent />
            </div>

            <div className="rounded-md border p-3 mb-3" style={{ borderColor: "var(--primary)", background: "var(--primary-tint)" }}>
              <div className="mono text-[10px] uppercase tracking-wide font-bold" style={{ color: "var(--primary-dark)" }}>
                Estimated controls sheet count
              </div>
              <div className="display text-lg font-extrabold my-1">
                {rollup.deviceCount === 0 ? "Add devices to estimate" : `${rollup.sheets} sheets · ${rollup.banks} valve bank${rollup.banks === 1 ? "" : "s"}`}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {rollup.banks} bank{rollup.banks === 1 ? "" : "s"} × 6 sheets (2 content + 2 spare before + 2 spare after). Driven by{" "}
                {rollup.pneumaticQty} pneumatic valve{rollup.pneumaticQty === 1 ? "" : "s"} (max {VALVES_PER_BANK}/bank) and {rollup.sensorQty} sensor
                {rollup.sensorQty === 1 ? "" : "s"} (max {SENSOR_PTS_PER_BANK}/bank).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <div className="mono text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mono text-lg font-semibold" style={{ color: accent ? "var(--accent-ink)" : "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
