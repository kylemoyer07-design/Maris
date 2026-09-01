"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandGroup from "@/components/BrandGroup";
import CatalogPartModal from "@/components/CatalogPartModal";
import { groupByBrand, loadPartsWithUsage, matchesPart, PartsData } from "@/lib/parts";
import {
  CATEGORY_LABEL,
  CATEGORY_TO_FAMILY,
  FAMILY_BLURB,
  FAMILY_LABEL,
  FAMILY_ORDER,
  FAMILY_TO_CATEGORY,
  Part,
} from "@/lib/types";

export default function LibraryPage() {
  const router = useRouter();
  const [data, setData] = useState<PartsData>({ parts: [], usage: {}, imageCount: 0 });
  const [cataloging, setCataloging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    loadPartsWithUsage().then((d) => {
      if (!active) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const { parts, usage, imageCount } = data;

  const searching = search.trim().length > 0;
  const matches = useMemo(() => parts.filter((p) => matchesPart(p, search)), [parts, search]);
  const grouped = useMemo(() => groupByBrand(matches), [matches]);

  const countFor = (category: string) => parts.filter((p) => p.category === category).length;
  const brandsFor = (category: string) => {
    const brands = [...new Set(parts.filter((p) => p.category === category && p.brand).map((p) => p.brand))];
    return brands.length ? brands.join(", ") : null;
  };

  const datasheetCount = parts.filter((p) => p.datasheet_path).length;
  const cadCount = parts.filter((p) => p.cad_path).length;

  return (
    <div className="max-w-5xl mx-auto" style={{ padding: "32px 24px" }}>
      <div className="flex justify-between flex-wrap items-baseline" style={{ gap: 12, marginBottom: 4 }}>
        <h1 className="display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Hardware Library
        </h1>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {loading ? "loading…" : `${parts.length} parts · shared across every job`}
        </span>
      </div>

      <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 780, margin: "0 0 20px" }}>
        The library holds part numbers, not device names. Catalog a part once — brand, spec,
        datasheet, CAD, I/O — then name it per station when you pull it into a job&apos;s OP.
      </p>

      <div className="flex flex-wrap" style={{ gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by part number, brand, or type…"
          className="paneliq-input"
          style={{ flex: 1, minWidth: 240 }}
        />
        <button
          type="button"
          onClick={() => setCataloging(true)}
          style={{
            background: "var(--primary)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 6,
            whiteSpace: "nowrap",
          }}
        >
          + Catalog New Part
        </button>
      </div>

      {searching ? (
        <>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
            {matches.length} of {parts.length} parts match &ldquo;{search}&rdquo;
          </div>
          {grouped.map(([brand, list]) => (
            <BrandGroup
              key={brand}
              brand={brand}
              list={list}
              usage={usage}
              collapsed={!!collapsed[brand]}
              onToggle={() => setCollapsed((c) => ({ ...c, [brand]: !c[brand] }))}
            />
          ))}
          {!matches.length && !loading && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No part matches &ldquo;{search}&rdquo;.
            </p>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
              gap: 12,
            }}
          >
            {FAMILY_ORDER.map((family) => {
              const category = FAMILY_TO_CATEGORY[family];
              const n = countFor(category);
              const brands = brandsFor(category);
              return (
                <Link
                  key={family}
                  href={`/library/${family}`}
                  className="flex flex-col"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 14,
                    gap: 8,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className={`pill ${category}`}>{CATEGORY_LABEL[category]}</span>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {n}
                    </span>
                  </div>
                  <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>
                    {FAMILY_LABEL[family]}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
                    {FAMILY_BLURB[family]}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {n ? `${n} parts${brands ? ` · ${brands}` : ""}` : "nothing catalogued yet"}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>
                    {n ? "View parts →" : "Catalog the first one →"}
                  </div>
                </Link>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            <StorageShortcut
              href="/datasheets"
              title="Datasheets & Manuals"
              meta={`${datasheetCount} files · one per part number`}
            />
            <StorageShortcut
              href="/cad"
              title="CAD Files"
              meta={`${cadCount} blocks on file · ${parts.length - cadCount} PNs missing`}
            />
            <StorageShortcut href="/images" title="Device Images" meta={`${imageCount} symbol files`} />
          </div>
        </>
      )}

      {cataloging && (
        <CatalogPartModal
          onSaved={(part: Part) => {
            setCataloging(false);
            // The new part is only visible on its family page, so go there.
            router.push(`/library/${CATEGORY_TO_FAMILY[part.category]}`);
          }}
          onCancel={() => setCataloging(false)}
        />
      )}
    </div>
  );
}

function StorageShortcut({ href, title, meta }: { href: "/datasheets" | "/cad" | "/images"; title: string; meta: string }) {
  return (
    <Link
      href={href}
      className="flex justify-between items-center flex-wrap"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 14,
        gap: 8,
      }}
    >
      <span>
        <span className="display" style={{ fontSize: 14, fontWeight: 700 }}>
          {title}
        </span>
        <br />
        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {meta}
        </span>
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap" }}>
        Open storage →
      </span>
    </Link>
  );
}
