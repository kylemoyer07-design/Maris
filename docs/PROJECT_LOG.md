# PanelIQ — Session Log

Append-only running history. **Newest entry first.** Written at the end of every working
session (Kyle says "session ended" → Claude writes the entry, refreshes `CLAUDE.md`, commits).

`CLAUDE.md` at the repo root is the short *current state* reference and loads automatically.
This file is the *how we got here*. `Session Handoffs/SESSION_1_HANDOFF.md` is the long
one-time briefing from the original Cowork session.

The entry template is at the bottom of this file.

---

## Session 2 — 2026-09-01 (Claude Code)

**Goal:** Get a fresh Claude Code session up to speed on the project, verify the Session 1
handoff against reality, and set up a durable way for future sessions to pick up where the last
one left off.

**What changed:**

- Added `.gitignore` (the repo had none — `node_modules` would have been committed the moment
  Node got installed). Untracked `.DS_Store` from the git index.
- Restored `CLAUDE.md` to the **repo root** and updated it with everything verified below.
- Created this log file.
- Committed Session 1's work — the design handoff, the extracted design bundle, and
  `SESSION_1_HANDOFF.md` — none of which had ever reached GitHub.
- Removed the duplicate `Session Handoffs/CLAUDE.md`; its content lives at the repo root now,
  updated. Two files named `CLAUDE.md` was the exact confusion that caused the problem below.

**Verified against the Session 1 handoff:**

| Claim | Result |
|---|---|
| Design zip needs extracting/reviewing | Already extracted — all 4 files byte-identical (sha) to `design_handoff_paneliq/`. Nothing extra in the zip. |
| Supabase data (14 devices, 1 job, 4 ops, 16 op_devices) | Confirmed exactly. Storage bucket exists with **0 objects**. |
| RLS "on but fully permissive" | Confirmed in `pg_policies` — one `ALL` policy per table, role `public`, `USING true` / `WITH CHECK true`. |
| Vercel MCP blind spot (§5C) | Confirmed. `list_projects` → `[]`, `get_project("paneliq")` → 404, `get_git_deployment_context` → `linkedProjects: []`. Team `Maris`/`maris14` visible, hobby plan. |
| App is "live" at the Vercel URL | **False as stated.** All three URL forms 302 → `vercel.com/sso-api`. Deployment Protection is on; the team cannot reach it. |

**New findings the handoff didn't have:**

1. **`CLAUDE.md` had been deleted from the repo root** and moved into `Session Handoffs/`. Claude
   Code only auto-loads root `CLAUDE.md`, so a fresh session started with zero context — Kyle
   had to @-mention the files by hand. Session 1's continuity mechanism was broken one session
   after it was written. Fixed.
2. **Nothing from Sessions 1–2 was ever committed.** `git status` showed `CLAUDE.md` deleted and
   all three handoff folders untracked. All of it existed only on Kyle's laptop.
3. **Node/npm are not installed on this Mac** — no node, npm, brew, or nvm anywhere on PATH.
   No local build, lint, or dev server is possible. This is the biggest practical obstacle to
   implementing a 7-screen redesign: every error would surface only after a push, using Vercel
   production deploys as the compiler.
4. **The Vercel login wall does not protect the database.** The Supabase URL and anon key are in
   `lib/supabase.ts` and ship in the browser bundle. With RLS fully permissive, anyone holding
   those has full read/write regardless of Deployment Protection. Turning protection off without
   tightening RLS first would make this a live public exposure.

**Decisions made:**

- **Session continuity uses three layers**, chosen for low maintenance over machinery: root
  `CLAUDE.md` (auto-loads, short, current state) → `docs/PROJECT_LOG.md` (this file, full
  history) → `SESSION_1_HANDOFF.md` (deep briefing, read on demand). The "session ended" trigger
  is written *into* `CLAUDE.md` itself rather than a hook or script, so it works automatically in
  every future session with nothing to install or maintain.
- **Kept both the zip and the extracted folder** in the repo. They're identical, but the zip is
  the original artifact from Claude Design and the existing docs reference both paths. ~350KB
  total — not worth optimizing.
- Scoped this session to a **safe first push**: docs, ignore rules, and continuity only. No app
  code, no database migration. Those are blocked on the open questions below.

**Open questions / blockers going into Session 3:**

1. Install Node (macOS arm64 LTS from nodejs.org) — blocks all local verification.
2. Kyle to check three Vercel dashboard settings Claude cannot read: **Root Directory** (clear
   it if it still says `paneliq` — deploys will fail otherwise), **Git connection**, and
   **Deployment Protection** (keep the login wall, or go public — if public, tighten RLS first).
3. The `part_number` blocker (§5A). Recommendation given: generate synthetic keys from
   name+station, flag them visibly in the UI as uncataloged, and keep the migration re-runnable
   for when real PNs arrive. Awaiting Kyle's decision — this changes what the library *means*,
   so it isn't Claude's call.

**Next step:** resolve #1 and #2 above, then start the redesign at step 1 of the build order in
`design_handoff_paneliq/README.md` (migration + `parts`/`op_devices`/`device_images`), using
whatever the `part_number` resolution turns out to be.

---

## Session 1 — 2026-08-30 to 08-31 (Claude Cowork, claude.ai)

> Reconstructed from `Session Handoffs/SESSION_1_HANDOFF.md` during Session 2 — this entry was
> not written live, so it's a summary of that document rather than a first-hand account. The
> handoff file itself is the authoritative record for this session.

**Goal:** Take PanelIQ from pitch artifacts to a real deployed app, then design the next version
of it properly.

**What was built:**

- The real Next.js 16 app (App Router, TypeScript, Tailwind v4) on Supabase + Vercel, replacing
  the frozen Claude Artifact demo. Four pages: `/`, `/library`, `/jobs`,
  `/jobs/[jobId]/ops/[opId]`.
- Supabase schema (`devices`, `jobs`, `ops`, `op_devices`) and the `device-files` storage bucket.
- Kyle's real OP230 data cataloged — 14 devices across 5 stations, validated against his actual
  drawings (26764-EL-288/289): 14 devices → 1 valve bank → 6 sheets, matching the real set.
- A full redesign produced in Claude Design and exported as a formal handoff bundle
  (`design_handoff_paneliq/`): 7 routes, a `parts` / `op_devices` model split, new storage
  browsers, company logo replacing the PanelIQ wordmark.
- `SESSION_1_HANDOFF.md` — the deep briefing, including the §5 risk list.

**Problems hit:**

- The repo was first pushed with the app nested under a `paneliq/` subfolder, which broke the
  Vercel build until Root Directory was set to `paneliq`. Later commit "moved files to root
  folder" undid the nesting — leaving the Root Directory setting potentially stale and able to
  break the *next* deploy the opposite way. Still unresolved as of Session 2.
- A first Claude Design canvas used **invented** device data (fabricated part numbers and
  names). Superseded by the proper handoff bundle; not a source of truth for anything.
- Discovered that all 14 real devices share the identical placeholder `part_number`, which
  breaks the redesign's `distinct on (part_number)` migration. Flagged as §5A, not resolved.

**Ended without:** committing any of the above to GitHub, and with `CLAUDE.md` left outside the
repo root — both fixed in Session 2.

---

## Entry template

Copy this shape for each new entry. Add new entries directly below the "Session Log" header at
the top of the file, not at the bottom.

```markdown
## Session N — YYYY-MM-DD (surface, e.g. Claude Code / Cowork)

**Goal:** What we set out to do at the start of the session.

**What changed:** Files, schema, config, deploys — concrete and specific.

**Decisions made:** What was chosen, what was rejected, and *why*. The why is the part that's
impossible to reconstruct later.

**What broke / surprised us:** Failures, wrong assumptions, things that cost time. Worth as much
as the successes.

**Open questions / blockers:** What's waiting on Kyle, on an external system, or on a decision.

**Next step:** The single thing the next session should start with.
```
