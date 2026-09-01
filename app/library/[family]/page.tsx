"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandGroup from "@/components/BrandGroup";
import { groupByBrand, loadPartsWithUsage, matchesPart, PartsData } from "@/lib/parts";
import {
  Family,
  FAMILY_BLURB,
  FAMILY_LABEL,
  FAMILY_ORDER,
  FAMILY_TO_CATEGORY,
} from "@/lib/types";

function isFamily(value: string): value is Family {
  return (FAMILY_ORDER as string[]).includes(value);
}

export default function FamilyPage() {
  const params = useParams<{ family: string }>();
  const [data, setData] = useState<PartsData>({ parts: [], usage: {}, imageCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const family = params.family;
  const valid = isFamily(family);

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

  const inFamily = useMemo(() => {
    if (!valid) return [];
    const category = FAMILY_TO_CATEGORY[family];
    return data.parts.filter((p) => p.category === category);
  }, [data.parts, family, valid]);

  const matches = useMemo(() => inFamily.filter((p) => matchesPart(p, search)), [inFamily, search]);
  const grouped = useMemo(() => groupByBrand(matches), [matches]);

  if (!valid) {
    return (
      <div className="max-w-5xl mx-auto" style={{ padding: "32px 24px" }}>
        <h1 className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Unknown family
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          &ldquo;{family}&rdquo; is not a library family.{" "}
          <Link href="/library" style={{ color: "var(--primary)" }}>
            Back to the Hardware Library
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto" style={{ padding: "32px 24px" }}>
      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
        <Link href="/library" style={{ color: "var(--primary)" }}>
          Hardware Library
        </Link>
        <span> / </span>
        <span style={{ color: "var(--text)" }}>{FAMILY_LABEL[family]}</span>
      </div>

      <div className="flex justify-between flex-wrap items-baseline" style={{ gap: 12, marginBottom: 4 }}>
        <h1 className="display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
          {FAMILY_LABEL[family]}
        </h1>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {loading ? "loading…" : `${matches.length} of ${data.parts.length} parts in the library`}
        </span>
      </div>

      <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 780, margin: "0 0 20px" }}>
        {FAMILY_BLURB[family]}
      </p>

      <div className="flex flex-wrap" style={{ gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by part number, brand, or type…"
          className="paneliq-input"
          style={{ flex: 1, minWidth: 240 }}
        />
      </div>

      {grouped.map(([brand, list]) => (
        <BrandGroup
          key={brand}
          brand={brand}
          list={list}
          usage={data.usage}
          collapsed={!!collapsed[brand]}
          onToggle={() => setCollapsed((c) => ({ ...c, [brand]: !c[brand] }))}
        />
      ))}

      {!loading && !matches.length && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {inFamily.length
            ? `No part in this family matches “${search}”.`
            : "Nothing catalogued in this family yet."}
        </p>
      )}
    </div>
  );
}
