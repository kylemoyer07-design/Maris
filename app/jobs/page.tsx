"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Job, Op } from "@/lib/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ops, setOps] = useState<Op[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: j }, { data: o }] = await Promise.all([
        supabase.from("jobs").select("*").order("job_number"),
        supabase.from("ops").select("*").order("op_number"),
      ]);
      setJobs((j as Job[]) || []);
      setOps((o as Op[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="display text-2xl font-extrabold mb-1">Jobs &amp; OPs</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Each OP pulls its devices from the shared Hardware Library.
      </p>

      {loading && <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>}

      <div className="flex flex-col gap-5">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="font-bold text-sm">
              {job.job_name} <span className="mono" style={{ color: "var(--text-muted)" }}>({job.job_number})</span>
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              {ops
                .filter((o) => o.job_id === job.id)
                .map((op) => (
                  <Link
                    key={op.id}
                    href={`/jobs/${job.id}/ops/${op.id}`}
                    className="rounded-md px-3 py-2 text-xs font-bold border"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    OP{op.op_number} — {op.name}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
