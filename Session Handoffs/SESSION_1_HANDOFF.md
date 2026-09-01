# PanelIQ — Session 1 Handoff (from Cowork)

This file is a handoff from a Cowork (claude.ai) session to whoever picks up PanelIQ next in Claude Code. It's written so a fresh session — with no memory of any earlier conversation — can read it once and understand the project, what already exists, what's about to be built, and where the real landmines are.

**Read in this order:** this file → `design_handoff_paneliq/README.md` (the actual design spec, extracted from the zip in `Claude Design Handover/`) → `CLAUDE.md` (short reference doc, kept up to date going forward).

---

## 1. What PanelIQ is, and Kyle's actual goal

Kyle is a hardware design engineer at **Maris Systems Design**, an automation/robotics integrator. Mechanical designs a machine; Kyle's group (hardware design) turns that into AutoCAD drawing packages and wiring diagrams. Today that process runs entirely in Excel, one spreadsheet per job, and every device gets redrawn from scratch every time it shows up on a new job — because there's no shared place that remembers "we've used this proximity switch before, here's its spec and I/O."

**PanelIQ's job:** replace that with a shared device/part library plus a per-job "OP" (operation/station) build view. Catalog a part once — spec, I/O, datasheet, CAD block — then pull it into any job's OP and get live rollup totals (I/O counts, enclosure sizing) and an **estimated AutoCAD controls-sheet count**, instead of guessing panel size before all devices are known. This was originally pitched to Maris leadership as a time-and-rework saver, and Kyle got buy-in to build a real Phase 1.

Kyle's stated top-level want, verbatim from this session: he wants a real, live, multi-user web tool — not another spreadsheet, not just a mockup — that his whole hardware design team can use, with login required, activity tracked (who logged in, who added what), and permissions so only certain people can create jobs / add devices / edit things while others may only be able to view.

---

## 2. What already exists (built across this and earlier Cowork sessions)

**Two frozen Claude Artifacts** — the original pitch, do not touch:
- Pitch deck: https://claude.ai/code/artifact/b44f7927-cea5-4c4f-95a5-c0baebfd2f12
- Interactive demo ("Genie – OP230"): https://claude.ai/code/artifact/b1d594f2-3ca7-4f7c-bb26-b0f414d8934f

**The real app** — Next.js 16 (App Router, TypeScript, Tailwind v4) + Supabase (Postgres + Storage + RLS) + Vercel, this repo:
- GitHub: `kylemoyer07-design/Maris` (private) — this is the repo Claude Code is sitting in right now.
- Vercel: project `paneliq`, team `Maris` (slug `maris14`, team id `team_Xr78UqlEIic7DxOIE5cxV0kx`). Live at **https://paneliq-k0hxhxbnq-maris14.vercel.app**. GitHub is linked to Vercel for auto-deploy on push (per the design handoff README; not independently re-verified this session — worth confirming a push actually triggers a build).
- Supabase project id `ohvgevtyklbjwwyfmche` (Kyle's own account). Tables today: `devices`, `jobs`, `ops`, `op_devices`, plus a `device-files` storage bucket. RLS is **on but fully permissive** — see the security note in Section 4.

**Pages that exist today:** `/` landing, `/library` (flat device list grouped by station), `/jobs` (job/OP list), `/jobs/[jobId]/ops/[opId]` (two-panel OP build: pull devices from the library, see live I/O rollup + sheet-count estimate).

**A separate Claude Design canvas** was also published this session as an Artifact (https://claude.ai/code/artifact/a1b4ec06-cfd5-4515-bee4-54ed262acc4d) — two static mockup screens matching the *current* app's look. **Important: that canvas used invented example device data (fabricated part numbers and device names), not Kyle's real cataloged devices.** It was a rough visual sketch, superseded by the much more thorough design handoff described in Section 3. Don't treat anything in that canvas as a source of truth for real data — Section 4 below has the real thing.

Kyle then built (in the actual claude.ai/design product, going well beyond that first sketch) a full redesign, and exported it as a formal handoff — that's Section 3.

---

## 3. The design handoff waiting to be implemented (this session's actual job)

Kyle's design work is in `Claude Design Handover/Maris-Claude Design Session 1.zip` in this repo, and has already been extracted alongside it into **`design_handoff_paneliq/`** for convenience (`README.md`, `Hardware Library.dc.html`, `logo.png`, `support.js`).

**Read `design_handoff_paneliq/README.md` in full before writing any code — it is the actual spec** (exact colors, spacing, copy, component behavior, and a suggested build order). It is much more detailed than this file and should be treated as authoritative for pixel-level decisions. What follows here is a summary plus the risk analysis that README doesn't cover.

**The core idea, and what it changes:** today's `devices` table conflates two different things — the *part* (a proximity switch, a cylinder — brand, spec, I/O, files) and the *named instance* of that part in a specific job (its name, station, cable tag). The redesign splits these into a `parts` library (one row per part number, no names/stations) and per-OP `op_devices` rows (where a part gets a name, station, and cable tag when it's pulled into a job). This is a real, legitimate modeling improvement — Kyle's real data already has the same part reused across multiple OPs under different names (see Section 4), which the current flat schema can't represent well.

**Scope of the redesign:** grows the app from 2 real pages to 7 routes — `/library` (hub with 4 category cards + storage shortcuts), `/library/[family]` (parts by brand), `/datasheets`, `/cad`, `/images` (new storage browsers), `/jobs` (with inline create-job/create-OP), and a rebuilt OP Build screen with an inline "name this part for this OP" flow. New nav: a tab bar under the header (Hardware Library · Datasheets & Manuals · CAD Files · Device Images · Jobs), and the "PanelIQ" wordmark is replaced with Kyle's actual company logo (`logo.png`, included in the handoff).

**The one file you can open and click through** is `Hardware Library.dc.html` — open it in a browser (needs network access for its runtime + Google Fonts; keep `logo.png` next to it). It's a working prototype of the hub + family + modal screens only. The other screens (datasheets/CAD/images/jobs/OP build) are spec'd in the README in the same level of CSS/copy detail but have no clickable prototype file — you're building those from the written spec.

**The README's own instruction, worth repeating:** the `.dc.html` is a single 106KB file with inline styles and in-memory state — it is a *design reference*, not code to port. Recreate the values, don't copy the markup.

---

## 4. The real current data — verified live in Supabase, 2026-09-01

This is what's actually in the database right now (queried directly, not assumed). It matters a lot for the migration in Section 3, so it's reproduced in full rather than summarized.

**Jobs / OPs** — one job, four OPs, only two of which have devices pulled in yet:

| Job | OP | Name | Devices linked |
|---|---|---|---|
| 26764 — Genie Baltic Rail Assembly (customer: Genie) | OP110 | Genie OP110 | 0 |
| | OP120 | Genie OP120 | 2 (Drop Deck Cylinder #1 & #2 — same two devices also used in OP230) |
| | OP130 | Genie OP130 | 0 |
| | OP230 | Genie OP230 — Rail Deck / Valve Bank | 14 |

**The 14 devices (all currently live in `devices`, all used in OP230):**

| Station | Name | Category | Part number | Cable | I/O (std in/out) |
|---|---|---|---|---|---|
| Tick Tock #1 | Tick Tock #1A Cylinder | pneumatic | — (mechanical BOM) | CBL1288331 (bank power) | 2/2 |
| Tick Tock #1 | Tick Tock #1B Cylinder | pneumatic | — (mechanical BOM) | CBL1288331 (bank power) | 2/2 |
| Tick Tock #1 | Tick Tock #1 Part Present PRX | sensor | — (mechanical BOM) | M12, 3-wire | 1/0 |
| Tick Tock #2 | Tick Tock #2A Cylinder | pneumatic | — (mechanical BOM) | CBL1288331 (bank power) | 2/2 |
| Tick Tock #2 | Tick Tock #2B Cylinder | pneumatic | — (mechanical BOM) | CBL1288331 (bank power) | 2/2 |
| Tick Tock #2 | Tick Tock #2 Part Present PRX | sensor | — (mechanical BOM) | M12, 3-wire | 1/0 |
| Drop Deck | Drop Deck Cylinder #1 | pneumatic | — (mechanical BOM) | CBL1288331 (bank power) | 2/2 |
| Drop Deck | Drop Deck Cylinder #2 | pneumatic | — (mechanical BOM) | CBL1288331 (bank power) | 2/2 |
| Rail Deck | Robot 1 Load Rail PRX | sensor | — (mechanical BOM) | M12, 3-wire | 1/0 |
| Rail Deck | Rail Deck Correct Orientation PRX | sensor | — (mechanical BOM) | M12, 3-wire | 1/0 |
| Transfer Conveyor | 7FT Rail Clear Transfer Conveyor PE | sensor | — (mechanical BOM) | M12, photoeye pair | 1/0 |
| Transfer Conveyor | 8FT Rail Clear Transfer Conveyor PE | sensor | — (mechanical BOM) | M12, photoeye pair | 1/0 |
| Transfer Conveyor | Label / Bracket Guide PE | sensor | — (mechanical BOM) | M12, photoeye pair (WHT signal) | 1/0 |
| Transfer Conveyor | Part Present Transfer Conveyor PE | sensor | — (mechanical BOM) | M12, photoeye pair | 1/0 |

None of the 14 have a `datasheet_path` or `cad_path` set (all null — no real files uploaded yet). `safe_in`/`safe_out` are 0 across the board. Note the pneumatic I/O here is **2 std in / 2 std out**, not 2/1 — double-check this against the README's rollup formula assumptions before trusting any stat-tile example numbers verbatim.

---

## 5. Downfalls and open risks — things to inspect and solve, not assume

These are specific to Kyle's real situation, verified this session. Work through them rather than assuming the design handoff's happy-path migration steps will just run cleanly.

**A. `part_number` cannot be the migration join key — every real device shares the exact same placeholder value.** The design handoff's suggested migration is `distinct on (part_number) → parts`, with `parts.part_number` as `unique`. But every single one of Kyle's 14 real devices has `part_number = "— (mechanical BOM)"` — a literal placeholder string, identical across all of them (see Section 4). Run that migration as written and all 14 devices collapse into a single `parts` row, destroying the catalog. Real part numbers live in mechanical's BOM, a separate source Kyle hasn't cataloged into this system yet. Before running any migration: either (a) get real part numbers from Kyle for these 14 devices first, or (b) generate a temporary unique synthetic key per distinct device (e.g. derived from name+station) so the migration is reversible/re-runnable once real PNs land, and make that placeholder state visually obvious in the UI (not just a blank field) so it doesn't get mistaken for real catalog data. Don't silently pick one — this changes what the library actually means going forward, and it's Kyle's call.

**B. RLS is currently wide open, and nothing in the design handoff changes that.** The Supabase anon key is public in the client bundle by design (Supabase's normal model), and the current RLS policies on `devices`/`jobs`/`ops`/`op_devices` are permissive prototype-phase policies — meaning anyone who finds the live URL and opens dev tools can read *and write* the entire database right now, no login required. The design handoff explicitly defers auth ("Not yet designed: auth") — correct scope call for this session — but it means the new `parts`, `op_devices`, and `device_images` tables need RLS policies too, and "permissive for now" needs to be a conscious, temporary decision each time, not a copy-pasted default nobody revisits. Kyle separately discussed wanting real login + role-based permissions (some people can add devices/create jobs, others read-only) + an activity/login audit log — none of that is built yet. It's out of scope for this specific session per the design handoff, but don't lose track of it; it's the natural next project once this migration lands, and the site is genuinely exposed until it ships.

**C. The Vercel Root Directory setting may be stale and could break the next deploy.** Earlier in this project, the app was pushed with everything nested under a `paneliq/` subfolder, which required setting Vercel's Project Settings → Root Directory to `paneliq` to fix a failed build. This repo's own git history shows a later commit "moved files to root folder" — `app/`, `lib/`, `components/` are now at the true repo root (confirmed by listing this working directory). If Vercel's Root Directory is still set to `paneliq`, the next push will fail to find the app — the mirror image of the original bug. This session's Vercel tooling couldn't independently re-verify the current dashboard value (a known blind spot — `list_projects`/`get_project` calls return empty even for the confirmed-live project). **Check Vercel → paneliq → Settings → General → Root Directory directly before or right after the first push of this work, and clear it back to blank if it still says `paneliq`.**

**D. The new `robot` category isn't in the app's type system yet, and isn't accounted for in the sheet-count formula.** `lib/types.ts`'s `Category` union is currently `"special" | "sensor" | "pneumatic"` — no `robot`. The design handoff introduces a 4th family, "Robots." Adding it touches `CATEGORY_LABEL`, the `.pill` CSS variants, and the family↔category map. Separately, the rollup math in the handoff only feeds `pneumatic` and `sensor` quantities into the valve-bank/sensor-bank sheet-count estimate — `special` and the new `robot` category devices don't contribute I/O to that number at all, same as today. Worth confirming with Kyle this is intentional and not just an oversight carried forward, especially since two of the real OP230 devices are named "Robot 1 Load Rail PRX" (currently categorized as `sensor`, not `robot`) — decide whether that recategorizes under the new model or stays a sensor.

**E. Only one of seven screens has a clickable prototype.** `Hardware Library.dc.html` covers the hub, family pages, and the catalog-part modal. Datasheets, CAD Files, Device Images, Jobs, and OP Build are spec'd in prose/CSS in the README with no interactive reference to click through — there's more room for interpretation there than the fully-prototyped screens, so it's worth flagging specific judgment calls back to Kyle as they come up rather than guessing silently on a 7-screen surface this size.

**F. `.dc.html` is a design reference, not code — don't let it get pasted into a component wholesale.** The README already says this explicitly (worth repeating because it's the single easiest shortcut to take on a 106KB single file with inline styles and no data layer). Recreate the documented values in the app's actual patterns — App Router pages, `"use client"`, Tailwind utilities, the CSS variables already in `app/globals.css` — don't lift markup.

**G. `CLAUDE.md` in this repo was stale until this handoff** (it was just a one-line `@AGENTS.md` placeholder — an earlier, more complete version got written in a different session but never made it into this repo). It's been refreshed as part of this handoff; keep it current going forward since it's what loads automatically every session, unlike this file.

---

## 6. Suggested order for this session

Roughly the design handoff's own "Suggested build order" section, with two items inserted at the front given Section 5:

0. Resolve the `part_number` blocker with Kyle (5A) before writing the migration — don't guess.
0.5. Check the Vercel Root Directory setting (5C) so the first deploy of this work doesn't fail on an unrelated stale config.
1. Migration + `parts` / `op_devices` (new shape) / `device_images` tables and storage buckets; backfill from `devices` using whatever the part-number resolution turns out to be.
2. Header + tab bar in `app/layout.tsx` (swap in the real logo).
3. `/library` hub and `/library/[family]` (read-only) — proves the part model works against real data.
4. Catalog New Part modal (replaces `components/DeviceForm.tsx`).
5. `/datasheets`, `/cad`, `/images`.
6. `/jobs` with create-job / create-OP (note: OP110/120/130/230 already exist as real rows — this isn't seed data to invent, it's already live).
7. OP Build with the naming flow, steppers, and rollups — validate the sheet-count output against Kyle's real OP230 drawings (26764-EL-288/289) the way the original prototype was validated: 14 devices → 1 valve bank → 6 sheets.

RLS policies for the new tables should be written alongside each table, not deferred to "later" as a batch — even if the policy is deliberately permissive for now, writing it explicitly (rather than leaving RLS off) keeps the security posture visible and easy to tighten later.
