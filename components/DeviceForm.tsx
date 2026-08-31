"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/lib/types";

const inputClass =
  "w-full px-2.5 py-2 rounded-md border text-sm bg-[var(--surface)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text)" };

export default function DeviceForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<Category>("special");
  const [station, setStation] = useState("");
  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [cableNumber, setCableNumber] = useState("");
  const [safety, setSafety] = useState(false);
  const [comm, setComm] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // category-specific
  const [type, setType] = useState("");
  const [voltage, setVoltage] = useState("");
  const [hp, setHp] = useState("");
  const [rpm, setRpm] = useState("");
  const [pnpNpn, setPnpNpn] = useState("");
  const [operate, setOperate] = useState("");
  const [numPins, setNumPins] = useState("");
  const [bore, setBore] = useState("");
  const [stroke, setStroke] = useState("");
  const [ports, setPorts] = useState("");
  const [valveType, setValveType] = useState("");

  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Give the device a name first.");
      return;
    }
    setSaving(true);
    setError(null);

    let spec: Record<string, string> = {};
    let std_in = 0,
      std_out = 0,
      safe_in = 0;
    const safe_out = 0;
    const io_note = "Manually cataloged — I/O impact not yet estimated.";

    if (category === "special") {
      spec = { type, voltage, hp: hp || "—", rpm: rpm || "—" };
      std_out = comm ? 0 : 1;
    } else if (category === "sensor") {
      spec = { type, voltage, pnpNpn, operate, numPins };
      std_in = 1;
    } else {
      spec = { bore, stroke, ports, valveType };
      std_in = 2;
      std_out = 1;
    }
    if (safety) {
      safe_in = Math.max(safe_in, 1);
      std_in = 0;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("devices")
      .insert({
        name,
        station: station || "General",
        category,
        part_number: partNumber || null,
        cable_number: cableNumber || null,
        safety,
        comm,
        revision_note: notes || null,
        std_in,
        std_out,
        safe_in,
        safe_out,
        io_note,
        spec,
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      setError(insertErr?.message || "Could not save device.");
      setSaving(false);
      return;
    }

    const deviceId = inserted.id as string;
    let datasheet_path: string | null = null;
    let cad_path: string | null = null;

    if (datasheetFile) {
      const path = `${deviceId}/datasheet-${datasheetFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("device-files")
        .upload(path, datasheetFile, { upsert: true });
      if (!upErr) datasheet_path = path;
    }
    if (cadFile) {
      const path = `${deviceId}/cad-${cadFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("device-files")
        .upload(path, cadFile, { upsert: true });
      if (!upErr) cad_path = path;
    }

    if (datasheet_path || cad_path) {
      await supabase
        .from("devices")
        .update({ datasheet_path, cad_path })
        .eq("id", deviceId);
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{ background: "rgba(10,14,18,.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] overflow-auto rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between sticky top-0"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <h3 className="font-bold text-sm">Catalog New Device</h3>
          <button onClick={onCancel} className="text-lg" style={{ color: "var(--text-muted)" }}>
            &times;
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Station / Assembly
              </label>
              <input className={inputClass} style={inputStyle} value={station} onChange={(e) => setStation(e.target.value)} placeholder="e.g. Washer" />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Device name
              </label>
              <input className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Washer Escape Cylinder" />
            </div>
          </div>

          <div className="flex gap-2">
            {(["special", "sensor", "pneumatic"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="flex-1 rounded-md px-2 py-2 text-xs font-bold border"
                style={
                  category === c
                    ? { borderColor: "var(--primary)", color: "var(--primary-dark)", background: "var(--primary-tint)" }
                    : { borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface)" }
                }
              >
                {c === "special" ? "Special" : c === "sensor" ? "Sensor" : "Pneumatic / Hydraulic"}
              </button>
            ))}
          </div>

          {category === "special" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" value={type} onChange={setType} />
              <Field label="Voltage" value={voltage} onChange={setVoltage} />
              <Field label="HP" value={hp} onChange={setHp} />
              <Field label="RPM" value={rpm} onChange={setRpm} />
            </div>
          )}
          {category === "sensor" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" value={type} onChange={setType} placeholder="e.g. Banner Q12, Emitter/Receiver" />
              <Field label="Voltage" value={voltage} onChange={setVoltage} />
              <Field label="PNP / NPN" value={pnpNpn} onChange={setPnpNpn} />
              <Field label="Light / Dark Operate" value={operate} onChange={setOperate} />
              <Field label="# of pins" value={numPins} onChange={setNumPins} />
            </div>
          )}
          {category === "pneumatic" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bore" value={bore} onChange={setBore} />
              <Field label="Stroke" value={stroke} onChange={setStroke} />
              <Field label="Ports" value={ports} onChange={setPorts} />
              <Field label="Valve type" value={valveType} onChange={setValveType} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Part #" value={partNumber} onChange={setPartNumber} placeholder="Used ~99% of the time to pull the datasheet" />
            <Field label="Cable #" value={cableNumber} onChange={setCableNumber} />
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} /> Safety-rated device
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={comm} onChange={(e) => setComm(e.target.checked)} /> Network / fieldbus communication device
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Datasheet (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setDatasheetFile(e.target.files?.[0] || null)}
                className="block w-full text-xs mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                CAD file
              </label>
              <input
                type="file"
                onChange={(e) => setCadFile(e.target.files?.[0] || null)}
                className="block w-full text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Notes / revision
            </label>
            <textarea className={inputClass} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && (
            <div className="text-xs font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onCancel} className="rounded-md px-4 py-2 text-xs font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md px-4 py-2 text-xs font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              {saving ? "Saving…" : "Add to Library"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input className={inputClass} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
