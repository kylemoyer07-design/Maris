"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, Device } from "@/lib/types";
import DeviceForm from "@/components/DeviceForm";

export default function LibraryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("devices")
      .select("*")
      .order("station", { ascending: true })
      .order("name", { ascending: true });
    setDevices((data as Device[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const stations = useMemo(() => {
    const map = new Map<string, Device[]>();
    const f = search.toLowerCase();
    devices.forEach((d) => {
      if (
        f &&
        !d.name.toLowerCase().includes(f) &&
        !(d.station || "").toLowerCase().includes(f) &&
        !(d.part_number || "").toLowerCase().includes(f)
      )
        return;
      const key = d.station || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return Array.from(map.entries());
  }, [devices, search]);

  function fileUrl(path: string | null) {
    if (!path) return null;
    return supabase.storage.from("device-files").getPublicUrl(path).data.publicUrl;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 className="display text-2xl font-extrabold">Hardware Library</h1>
        <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>
          {devices.length} devices · shared across every job
        </span>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        Catalog a device once here — spec, datasheet, CAD file, I/O — then pull it into any job&apos;s OP.
      </p>

      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by device, station, or part number…"
          className="flex-1 px-3 py-2 rounded-md border text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md px-4 py-2 text-sm font-bold text-white whitespace-nowrap"
          style={{ background: "var(--primary)" }}
        >
          + Catalog New Device
        </button>
      </div>

      {loading && <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>}
      {!loading && devices.length === 0 && (
        <div
          className="text-sm rounded-lg border p-6 text-center"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Nothing in the library yet — add the first device.
        </div>
      )}

      <div className="flex flex-col gap-1">
        {stations.map(([station, list]) => (
          <div key={station}>
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [station]: !c[station] }))}
              className="w-full flex items-center justify-between py-2 border-b text-left"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {station}
              </span>
              <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>
                {list.length}
              </span>
            </button>
            {!collapsed[station] && (
              <div className="flex flex-col gap-2 py-2">
                {list.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap font-bold text-sm">
                      {d.name}
                      <span className={`pill ${d.category}`}>{CATEGORY_LABEL[d.category]}</span>
                      {d.safety && <span className="pill safety">Safety</span>}
                      {d.comm && (
                        <span className="pill safety" style={{ borderColor: "var(--primary)", color: "var(--primary-dark)" }}>
                          Comm
                        </span>
                      )}
                    </div>
                    <div className="mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      PN: <b style={{ color: "var(--text)" }}>{d.part_number || "—"}</b>
                      {d.cable_number ? (
                        <>
                          {" "}
                          · Cable: <b style={{ color: "var(--text)" }}>{d.cable_number}</b>
                        </>
                      ) : null}
                      {" "}· I/O: {d.std_in}/{d.std_out} std, {d.safe_in}/{d.safe_out} safety
                    </div>
                    <div className="flex gap-4 mt-2 text-xs font-semibold">
                      {fileUrl(d.datasheet_path) ? (
                        <a href={fileUrl(d.datasheet_path)!} target="_blank" style={{ color: "var(--primary)" }}>
                          Datasheet
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>No datasheet on file</span>
                      )}
                      {fileUrl(d.cad_path) ? (
                        <a href={fileUrl(d.cad_path)!} target="_blank" style={{ color: "var(--primary)" }}>
                          CAD file
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>No CAD file on file</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <DeviceForm
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
