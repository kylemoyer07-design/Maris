"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Category, DeviceImage, Part } from "@/lib/types";

// Segmented-control options. Order and labels come from the design handoff.
const CATEGORY_OPTIONS: { key: Category; label: string }[] = [
  { key: "sensor", label: "Electrical" },
  { key: "pneumatic", label: "Pneumatic / Hyd." },
  { key: "special", label: "Special" },
  { key: "robot", label: "Robot" },
];
const SIGNAL_OPTIONS = ["PNP", "NPN", "NA"];
const OPERATE_OPTIONS = ["Light", "Dark", "NA"];

const READY_HINT =
  "Device names, stations and cable tags get assigned when this part is added to an OP.";
const NOT_READY_HINT =
  "Part # is required — it's how the library is sorted and how files link.";

interface FormState {
  pn: string;
  brand: string;
  category: Category;
  type: string;
  voltage: string;
  signal: string;
  operate: string;
  hp: string;
  rpm: string;
  cablePn: string;
  pins: string;
  addlSwitch: string;
  addlCable: string;
  safety: boolean;
  comm: boolean;
  stdIn: string;
  stdOut: string;
  safeIn: string;
  safeOut: string;
  cutSheet: string;
  controlsInfo: string;
  notes: string;
  imageId: string;
}

function blankForm(category: Category): FormState {
  return {
    pn: "",
    brand: "",
    category,
    type: "",
    voltage: "",
    signal: "PNP",
    operate: "NA",
    hp: "",
    rpm: "",
    cablePn: "",
    pins: "",
    addlSwitch: "",
    addlCable: "",
    safety: false,
    comm: false,
    stdIn: "1",
    stdOut: "0",
    safeIn: "0",
    safeOut: "0",
    cutSheet: "",
    controlsInfo: "",
    notes: "",
    imageId: "",
  };
}

/** Blank strings become NULL — an empty spec field is "not recorded", not "". */
const orNull = (v: string) => v.trim() || null;
const num = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
};

/** "PRX-N.O.pdf" -> "PRX N.O." — the short label shown on an image tile. */
function symbolFromName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || name;
}

/** Storage keys stay to a conservative charset; the original name lives in the row. */
function storageSafe(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "-");
}

function publicUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("device-files").getPublicUrl(path).data.publicUrl;
}

export default function CatalogPartModal({
  initialCategory = "sensor",
  onSaved,
  onCancel,
}: {
  initialCategory?: Category;
  /** Receives the inserted row so the caller can route to its family page. */
  onSaved: (part: Part) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => blankForm(initialCategory));
  const [images, setImages] = useState<DeviceImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const ready = form.pn.trim().length > 0;

  useEffect(() => {
    let active = true;
    supabase
      .from("device_images")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (active) setImages((data as DeviceImage[]) || []);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  /** Images are independent rows, so they upload immediately — not on save. */
  async function handleImageFile(file: File) {
    setUploadingImage(true);
    setError(null);
    const path = `images/${crypto.randomUUID()}-${storageSafe(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from("device-files")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setError(`Could not upload ${file.name}: ${upErr.message}`);
      setUploadingImage(false);
      return;
    }
    const { data, error: insErr } = await supabase
      .from("device_images")
      .insert({
        name: file.name,
        symbol: symbolFromName(file.name),
        kind: /\.pdf$/i.test(file.name) ? "PDF symbol" : "Image",
        path,
      })
      .select()
      .single();
    if (insErr || !data) {
      setError(insErr?.message || "Could not record the image.");
      setUploadingImage(false);
      return;
    }
    const image = data as DeviceImage;
    setImages((prev) => [...prev, image]);
    set("imageId", image.id);
    setUploadingImage(false);
  }

  async function handleSave() {
    if (!ready) {
      setError(NOT_READY_HINT);
      return;
    }
    setSaving(true);
    setError(null);

    const { data: inserted, error: insErr } = await supabase
      .from("parts")
      .insert({
        part_number: form.pn.trim(),
        brand: orNull(form.brand),
        category: form.category,
        type: orNull(form.type),
        voltage: orNull(form.voltage),
        signal: orNull(form.signal),
        operate: orNull(form.operate),
        hp: orNull(form.hp),
        rpm: orNull(form.rpm),
        cable_pn: orNull(form.cablePn),
        pins: orNull(form.pins),
        addl_switch: orNull(form.addlSwitch),
        addl_cable: orNull(form.addlCable),
        safety: form.safety,
        comm: form.comm,
        std_in: num(form.stdIn),
        std_out: num(form.stdOut),
        safe_in: num(form.safeIn),
        safe_out: num(form.safeOut),
        cut_sheet: orNull(form.cutSheet),
        controls_info: orNull(form.controlsInfo),
        notes: orNull(form.notes),
        image_id: form.imageId || null,
      })
      .select()
      .single();

    if (insErr || !inserted) {
      // 23505 is the unique violation on parts.part_number.
      setError(
        insErr?.code === "23505"
          ? `${form.pn.trim()} is already in the library.`
          : insErr?.message || "Could not save the part."
      );
      setSaving(false);
      return;
    }

    const part = inserted as Part;
    let datasheet_path: string | null = null;
    let cad_path: string | null = null;

    if (datasheetFile) {
      const path = `${part.id}/datasheet-${storageSafe(datasheetFile.name)}`;
      const { error: upErr } = await supabase.storage
        .from("device-files")
        .upload(path, datasheetFile, { upsert: true });
      if (!upErr) datasheet_path = path;
    }
    if (cadFile) {
      const path = `${part.id}/cad-${storageSafe(cadFile.name)}`;
      const { error: upErr } = await supabase.storage
        .from("device-files")
        .upload(path, cadFile, { upsert: true });
      if (!upErr) cad_path = path;
    }

    if (datasheet_path || cad_path) {
      await supabase.from("parts").update({ datasheet_path, cad_path }).eq("id", part.id);
      part.datasheet_path = datasheet_path;
      part.cad_path = cad_path;
    }

    setSaving(false);
    onSaved(part);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27, 34, 44, 0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "28px 20px",
        overflowY: "auto",
        zIndex: 60,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Catalog New Part"
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "calc(100vh - 56px)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span
            className="display"
            style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}
          >
            Catalog New Part
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
              fontSize: 18,
              lineHeight: 1,
              color: "var(--text-muted)",
              padding: "2px 4px",
            }}
          >
            ×
          </button>
        </div>

        <div
          className="flex flex-col"
          style={{ padding: 20, gap: 20, overflowY: "auto", overflowX: "hidden" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
            <Field
              label="Part #"
              required
              mono
              value={form.pn}
              onChange={(v) => set("pn", v)}
              placeholder="BES M08EH1-PSC60F-S49G"
            />
            <Field
              label="Brand / manufacturer"
              value={form.brand}
              onChange={(v) => set("brand", v)}
              placeholder="e.g. Balluff"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => set("category", c.key)}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "10px 8px",
                  borderRadius: 6,
                  border: "1px solid",
                  ...pickStyle(form.category === c.key),
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div>
            <SectionHeading>Mechanical information</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field
                label="Type"
                value={form.type}
                onChange={(v) => set("type", v)}
                placeholder="e.g. Proximity switch"
              />
              <Field
                label="Voltage"
                mono
                value={form.voltage}
                onChange={(v) => set("voltage", v)}
                placeholder="e.g. 10-30VDC"
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginTop: 14,
              }}
            >
              <Segmented
                label="PNP / NPN"
                options={SIGNAL_OPTIONS}
                value={form.signal}
                onChange={(v) => set("signal", v)}
              />
              <Segmented
                label="Light / dark operate"
                options={OPERATE_OPTIONS}
                value={form.operate}
                onChange={(v) => set("operate", v)}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginTop: 14,
              }}
            >
              <Field
                label="HP"
                mono
                value={form.hp}
                onChange={(v) => set("hp", v)}
                placeholder="motors only"
              />
              <Field
                label="RPM"
                mono
                value={form.rpm}
                onChange={(v) => set("rpm", v)}
                placeholder="motors only"
              />
            </div>
          </div>

          <div>
            <SectionHeading>
              Additional information — all P/N controls info required
            </SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <Field
                label="Cable P/N"
                mono
                value={form.cablePn}
                onChange={(v) => set("cablePn", v)}
                placeholder="7000-08041-6501000"
              />
              <Field
                label="# of pins"
                mono
                value={form.pins}
                onChange={(v) => set("pins", v)}
                placeholder="3"
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginTop: 14,
              }}
            >
              <Field
                label="Additional switch information"
                value={form.addlSwitch}
                onChange={(v) => set("addlSwitch", v)}
                placeholder="e.g. M8 quick-disconnect"
              />
              <Field
                label="Additional cable information"
                value={form.addlCable}
                onChange={(v) => set("addlCable", v)}
                placeholder="e.g. 10M PUR"
              />
            </div>
          </div>

          <div>
            <SectionHeading>Controls information</SectionHeading>
            <div className="flex flex-col" style={{ gap: 8, marginBottom: 14 }}>
              <Check
                label="Safety-rated part"
                checked={form.safety}
                onChange={(v) => set("safety", v)}
              />
              <Check
                label="Network / fieldbus communication part"
                checked={form.comm}
                onChange={(v) => set("comm", v)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              <IoField label="Std in" value={form.stdIn} onChange={(v) => set("stdIn", v)} />
              <IoField label="Std out" value={form.stdOut} onChange={(v) => set("stdOut", v)} />
              <IoField
                label="Safety in"
                safety
                value={form.safeIn}
                onChange={(v) => set("safeIn", v)}
              />
              <IoField
                label="Safety out"
                safety
                value={form.safeOut}
                onChange={(v) => set("safeOut", v)}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field
                label="Cut sheet path / link"
                mono
                value={form.cutSheet}
                onChange={(v) => set("cutSheet", v)}
                placeholder="..\Mechanical Design\Cut Sheets\OP230"
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field
                label="Safety / additional controls info"
                value={form.controlsInfo}
                onChange={(v) => set("controlsInfo", v)}
                placeholder="e.g. dual-channel, feeds safety relay K3"
              />
            </div>
          </div>

          <div>
            <SectionHeading>Device image / symbol</SectionHeading>
            <div className="flex flex-wrap items-stretch" style={{ gap: 10 }}>
              {images.map((image) => {
                const selected = form.imageId === image.id;
                const url = /\.pdf$/i.test(image.name) ? null : publicUrl(image.path);
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => set("imageId", selected ? "" : image.id)}
                    style={{
                      width: 104,
                      padding: 7,
                      borderRadius: 6,
                      textAlign: "center",
                      border: "1px solid",
                      ...pickStyle(selected),
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        height: 58,
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        background: "var(--surface)",
                        overflow: "hidden",
                      }}
                    >
                      {url ? (
                        // Supabase storage URLs are arbitrary hosts; next/image would
                        // need a remotePatterns entry for no gain on a 58px tile.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={image.symbol}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            mixBlendMode: "multiply",
                          }}
                        />
                      ) : (
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                          {image.symbol}
                        </span>
                      )}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {image.name}
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                disabled={uploadingImage}
                style={{
                  width: 104,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary)",
                  border: "1px dashed var(--border)",
                  borderRadius: 6,
                  background: "none",
                  padding: 7,
                }}
              >
                {uploadingImage ? (
                  "Uploading…"
                ) : (
                  <>
                    + Upload
                    <br />
                    image / PDF
                  </>
                )}
              </button>
              <input
                ref={imageInput}
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleImageFile(file);
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              Picked images land in the Device Images tab and stay linked to this part number.
            </div>
          </div>

          <div>
            <SectionHeading>Files</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FileField
                label="Datasheet (PDF)"
                accept=".pdf"
                onPick={setDatasheetFile}
              />
              <FileField
                label="CAD file"
                accept=".dwg,.dxf,.step,.stp"
                onPick={setCadFile}
              />
            </div>
          </div>

          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
              Notes / revision
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Revision note, substitutions, anything the next engineer needs."
              className="paneliq-input"
              style={{ width: "100%", fontSize: 13, padding: "8px 10px", resize: "vertical" }}
            />
          </label>

          {error && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>{error}</div>
          )}
        </div>

        <div
          className="flex items-center justify-between flex-wrap"
          style={{
            gap: 12,
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontSize: 12, color: ready ? "var(--text-muted)" : "var(--accent-ink)" }}
          >
            {ready ? READY_HINT : NOT_READY_HINT}
          </span>
          <div className="flex" style={{ gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text)",
                background: "var(--surface)",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                border: "none",
                borderRadius: 6,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                background: "var(--primary)",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Add to Library"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Selected / unselected styling shared by the segmented rows and image tiles. */
function pickStyle(selected: boolean) {
  return selected
    ? {
        borderColor: "var(--primary)",
        background: "var(--primary-tint)",
        color: "var(--primary-dark)",
      }
    : {
        borderColor: "var(--border)",
        background: "var(--surface)",
        color: "var(--text-muted)",
      };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
        paddingBottom: 7,
        borderBottom: "1px solid var(--border)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: "var(--accent-ink)" }}> required</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`paneliq-input ${mono ? "mono" : ""}`}
        style={{ width: "100%", fontSize: 13, padding: "8px 10px" }}
      />
    </label>
  );
}

/** Numeric I/O input. Safety counts carry the amber treatment everywhere. */
function IoField({
  label,
  value,
  onChange,
  safety,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  safety?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-muted)",
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        className="paneliq-input mono"
        style={{
          width: "100%",
          fontSize: 13,
          padding: "8px 10px",
          background: safety ? "var(--accent-tint)" : "var(--surface-2)",
          color: safety ? "var(--accent-ink)" : "var(--text)",
        }}
      />
    </label>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
        {label}
      </span>
      <div className="flex" style={{ gap: 6 }}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 6px",
              borderRadius: 6,
              border: "1px solid",
              ...pickStyle(value === option),
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center" style={{ gap: 9, fontSize: 13, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: "var(--primary)" }}
      />
      {label}
    </label>
  );
}

function FileField({
  label,
  accept,
  onPick,
}: {
  label: string;
  accept: string;
  onPick: (file: File | null) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
        {label}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onPick(e.target.files?.[0] || null)}
        style={{ width: "100%", fontSize: 12, color: "var(--text-muted)" }}
      />
    </label>
  );
}
