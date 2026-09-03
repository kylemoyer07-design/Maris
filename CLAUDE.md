@AGENTS.md

# PanelIQ

Internal tool for Kyle's hardware design team at Maris Systems Design (automation/robotics
integrator). Mechanical designs a machine; hardware design (Kyle's group) turns that into
AutoCAD drawing packages and wiring diagrams. PanelIQ replaces the current all-Excel workflow
with a shared device/part library plus per-job "OP" (operation/station) rollups, so hardware
design stops re-drawing the same devices from scratch on every job and stops guessing at
enclosure/panel sizing before all devices are known.

Kyle's stated end goal: a real, live, **multi-user** web tool his whole hardware design team
uses — login required, activity tracked (who logged in, who added what), and permissions so
only certain people can create jobs / add devices while others are read-only.

## How context works here — read this first

Project knowledge lives in **three layers**. Know which layer a new fact belongs in before
writing it down; the fastest way to rot this system is to write the same fact into two layers
and let them drift apart.

| Layer | Where | Loads | Holds |
|---|---|---|---|
| 1. Current state | `CLAUDE.md` (this file, repo root) | **Automatically, every session** | What's true *right now*: live services, data model, business rules, conventions, open items. Kept short. |
| 2. History | `docs/PROJECT_LOG.md` | On demand — read it at session start | *How we got here*: one entry per session, newest first. Decisions and their reasoning, what broke, what surprised us. Append-only; never rewrite past entries. |
| 3. Working relationship | `~/.claude/projects/-Users-kylemoyer-Maris/memory/` | **Automatically, every session** | Facts about Kyle and how to work with him — not project state. Machine-local, **not in git**. |

Also present: `SESSION_1_HANDOFF.md`, the long one-time briefing from the
original Cowork session. Read on demand, not every session. It is a historical record — where it
disagrees with this file, **this file wins**, because several of its claims were already stale
when checked (see the Session 2 log entry).

**Routing rule for anything new you learn:**

- A fact about the project (schema, service state, a business rule, a convention) → update
  **`CLAUDE.md`**, and log the *reasoning* in **`PROJECT_LOG.md`**.
- The story of what happened this session → **`PROJECT_LOG.md`** only.
- A fact about Kyle — his expertise, his preferences, how he wants you to work → **memory**.
- If you're about to write the same sentence into two layers, stop and pick one.

**Maintaining memory (layer 3):** before adding a memory, check whether an existing one already
covers it and update that file instead of creating a near-duplicate. Delete memories that turn
out to be wrong rather than layering corrections on top. Don't put project state in memory —
that's layer 1's job, and memory doesn't travel to another machine or to Cowork/claude.ai
sessions, so anything the team or another surface needs must live in the repo. Memories written
so far are indexed in `MEMORY.md` in that directory.

## Session protocol

**At session start:** this file loads automatically. Read `docs/PROJECT_LOG.md` (newest entry
first) to see where the last session left off. That's normally enough to start work.

**When Kyle says "session ended"** (or "end session", "wrap up", or similar):

1. Append a new entry to the **top** of the session log in `docs/PROJECT_LOG.md`, following the
   template at the bottom of that file. Cover: what we set out to do, what actually changed,
   decisions made *and why*, what broke or surprised us, open questions, and the single next
   step. The *why* is the part that can't be reconstructed later from the diff.
2. Update the **"Current state"** and **"Open items"** sections of this file so they're accurate
   as of right now. Keep this file short — history goes in the log, not here.
3. Consider whether anything learned about *Kyle* (not the project) belongs in memory, per the
   routing rule above.
4. Commit everything, then tell Kyle exactly what was written.

Do this while the session is still live. If the terminal closes without it, that session's
reasoning is lost and the next session will read a "current state" that is quietly out of date —
the failure mode is silent, which is what makes it dangerous.

**Verify before you trust.** Prior-session claims in this repo have been wrong or stale more
than once — the app described as "live" was behind a login wall, the design zip described as
needing extraction was already extracted, and `CLAUDE.md` itself had been deleted from the root
while a handoff described it as current. The Supabase MCP connector works fully, so check the
database directly rather than quoting a document. Do the same for anything cheap to verify.

## Current state (verified 2026-09-03, Session 4)

**Repo**: `kylemoyer07-design/Maris` (private). Next.js 16 App Router + TypeScript + Tailwind v4
+ Supabase. `app/`, `lib/`, `components/` sit at the true repo root (the app was once nested
under a `paneliq/` subfolder — see the Vercel note below, this still matters).

**Git / GitHub**: remote is SSH (`git@github.com:kylemoyer07-design/Maris.git`); pushes to
`main` work and were verified in Session 2. **The `gh` CLI is not installed**, so there is no PR
workflow available — don't plan one, and don't reach for `gh` commands. Work goes straight to
`main`, which is also what triggers the Vercel deploy. All history is on `main`; no other
branches exist.

**Local dev environment**: **Node 24.20.0 / npm 11.19.0 are installed** (`/usr/local/bin`,
official .pkg — no Homebrew, no nvm), and `node_modules` is populated. `npm run build`,
`npm run dev` and `npm run lint` all work. **Build and lint locally before every push** —
Sessions 1-3 had no compiler and it made every change a gamble; that constraint is gone, so there
is no excuse for shipping code that hasn't been typechecked. Note the shell may need
`export PATH="$PATH:/usr/local/bin"`.

`npm run lint` is clean except one known warning (`no-page-custom-font` in `app/layout.tsx`, see
Conventions). `design_handoff_paneliq/` is in the ESLint ignore list — it is a design reference,
not source, and its 3 errors were the only thing making `lint` unusable. `.claude/launch.json`
defines the `paneliq` dev server for the browser preview tool; prefer that over running
`next dev` from a shell.

`next-env.d.ts` flips between `.next/types` (after `next build`) and `.next/dev/types` (after
`next dev`). It is generated — don't commit the churn. It also confirms **`typedRoutes` is on**
even though `next.config.ts` never sets the flag, which is why every `<Link>` target has to be a
real route.

**Vercel**: project `paneliq`, team `Maris` (slug `maris14`, id `team_Xr78UqlEIic7DxOIE5cxV0kx`),
**hobby plan**.

- **Production URL is `https://paneliq-five.vercel.app` — public, no login wall.** Verified
  2026-09-01 (Session 3): HTTP 200, no redirect, and `/`, `/library`, `/jobs`, `/datasheets`,
  `/cad`, `/images` all return 200. The `-five` suffix exists because plain `paneliq.vercel.app`
  was already taken by an unrelated project. **Use this hostname.** Do not guess at Vercel
  hostnames — `paneliq-maris14`, `paneliq-git-main-maris14`, and the hashed per-deployment URL
  `paneliq-k0hxhxbnq-maris14` all redirect to `vercel.com/sso-api`, which is normal Vercel
  behaviour for non-production hosts and says nothing about the production alias.
- **GitHub IS connected and auto-deploy works.** A push to `main` builds and deploys on its own;
  confirmed by the Session 3 canary commit appearing live. The Vercel dashboard project card
  shows the repo `kylemoyer07-design/Maris` and the latest commit message.
- **Root Directory is correct** (blank / `./`) — proven by the fact that the canary built and
  deployed successfully with the app at the repo root. The long-standing "stale Root Directory"
  worry from Sessions 1–2 is resolved; stop carrying it forward.
- **The Vercel MCP connector cannot see this project** — `list_projects` returns `[]`,
  `get_project("paneliq")` 404s, and `list_deployments` is blocked by the permission classifier.
  This is a **connector scope limitation, not evidence about the project.** Session 3 wrongly
  treated `get_git_deployment_context`'s `linkedProjects: []` as proof that GitHub was
  disconnected; it is not — that field does not report ordinary Git integrations. To check
  whether a deploy landed, **`curl` the production URL and grep the prerendered HTML for markup
  only the new code could emit** — that works, is cheap, and needs nothing from Kyle. Grep the
  *HTML*, not the JS bundles: production chunk paths are `/_next/static/immutable/chunks/`, and a
  wrong-path grep returns zero hits that read exactly like a failed deploy. Prefer a positive
  marker (new markup present) over an absence check (old string gone).

**Supabase**: project `ohvgevtyklbjwwyfmche` (Kyle's own account, org `iogskoevbliocztjduxf`,
us-east-2, Postgres 17, ACTIVE_HEALTHY). The Supabase MCP connector **works fully** — reads,
SQL, and migrations all function. Tables (counts verified 2026-09-03): `parts` (14),
`device_images` (0), `devices` (14, legacy), `jobs` (1), `ops` (4), `op_devices` (16), plus a
`device-files` storage bucket holding **0 objects** (no real files uploaded yet).

**SECURITY — the database is publicly readable and writable right now.** RLS is enabled on all
six tables with **fully permissive** policies (re-verified in `pg_policies` on 2026-09-03: one
`ALL` policy per table — `parts`, `device_images`, `devices`, `jobs`, `ops`, `op_devices` — role
`public`, `USING true` / `WITH CHECK true`). The app has no login. The production
site is public, and the Supabase URL and publishable key are hardcoded in `lib/supabase.ts` and
ship in the browser bundle.

This was **confirmed live in Session 3**, not theorised: an unauthenticated request to
`https://ohvgevtyklbjwwyfmche.supabase.co/rest/v1/devices?select=name&limit=3` with only the
published key returned real device rows, HTTP 200. `USING true` / `WITH CHECK true` on an `ALL`
policy means writes and deletes are equally open. Anyone who views the page source can read,
modify, or delete the entire catalog.

Sessions 1 and 2 both recorded this as a future risk partly mitigated by a Vercel login wall.
That was wrong — the production alias was never behind one. Treat it as a live exposure, not a
prototype-phase note. It is item 1 in Open items for that reason.

**Original pitch deck + interactive demo** (Claude Artifacts, not this codebase — reference/
history, do not edit):
- Deck: https://claude.ai/code/artifact/b44f7927-cea5-4c4f-95a5-c0baebfd2f12
- Demo ("Genie – OP230"): https://claude.ai/code/artifact/b1d594f2-3ca7-4f7c-bb26-b0f414d8934f

**Pending redesign**: spec'd in `design_handoff_paneliq/README.md`, extracted from
`Claude Design Handover/Maris-Claude Design Session 1.zip`. Verified byte-identical to the zip —
the zip holds nothing extra, so work from the extracted folder. See `SESSION_1_HANDOFF.md` §5
for the risk list before starting.

## Pages (current — redesign steps 1-4 done, 5-7 outstanding)

- `/` — landing page with links into the app.
- `/library` — the Hardware Library hub: 4 family cards + 3 storage shortcuts, with search
  across all families. "+ Catalog New Part" opens the modal (`components/CatalogPartModal.tsx`).
- `/library/[family]` — parts in one family, grouped by brand, collapsible, scoped search. Also
  carries "+ Catalog New Part", pre-selected to that family.
- `/jobs` — list of jobs and their OPs.
- `/jobs/[jobId]/ops/[opId]` — the OP build view: pull devices from the shared library into
  this OP (left panel), see live I/O rollup and the estimated controls-sheet count (right panel).

`/datasheets`, `/cad` and `/images` exist as "Not built yet" stubs (step 5). `/jobs` and OP Build
are still the pre-redesign versions reading the legacy `devices` table.

## Data model

**Current shape (migration applied 2026-09-01, Session 3).** The flat `devices` table has been
split, additively — `devices` still exists and is still read by the pages not yet rebuilt.

`parts` — the library, one row per part number, no names or stations. Columns per the handoff
spec plus three additions: `provisional_part_number` (bool), `legacy_device_id`, and
`legacy_spec` (the original `spec` jsonb, preserved so nothing was lost). `brand` is nullable,
unlike the spec, because no brand data exists on the real rows yet. `category` is checked
against `sensor | pneumatic | special | robot`.

`device_images` — symbol PDFs / photos, per the spec.

`op_devices` — gained `part_id`, `name`, `station`, `cable_tag`, `sort_order`. This is where
device names live now. `device_id` is still NOT NULL and still populated, keeping the old OP
Build page working; drop it once that page is rebuilt.

**Part numbers are synthetic and flagged.** All 14 devices shared the identical placeholder
`— (mechanical BOM)`, so each got a generated `UNCAT-<STATION>-<NAME>` key with
`provisional_part_number = true`, surfaced in the UI as an amber "Uncatalogued P/N" pill. This
was **Kyle's decision** (option b of three). The migration is re-runnable: when mechanical's BOM
numbers arrive, each device already has its own row to update. Result: 14 parts, 14 distinct
part numbers, 16 OP instances linked and named, 0 rows lost.

**Categorize by the part, never by the device name.** Kyle's standing rule. `Robot 1 Load Rail
PRX` is a proximity sensor, so its part sits under `sensor` / the Electrical family; the robot
association belongs to the OP instance where he names it. The `robot` category exists for
hardware that genuinely is robot hardware. When a name and a part number disagree, the part
number wins — for grouping, sorting, dedup, and file joins alike.

## Legacy data model (pre-split, still live behind `parts`)

`devices`: id, station, name, category (`special` | `sensor` | `pneumatic`), part_number,
cable_number, cut_sheet_link, safety (bool), comm (bool), revision_note, std_in, std_out,
safe_in, safe_out, io_note, spec (jsonb), ctrl (jsonb), datasheet_path, cad_path, created_at.

`jobs`: id, job_number, job_name, customer, created_at.
`ops`: id, job_id, op_number, name.
`op_devices`: id, op_id, device_id, quantity — join table driving the per-OP rollup.

**Real current data** (verified live, not seed/placeholder): job 26764 "Genie Baltic Rail
Assembly" with OPs 110/120/130/230. OP230 has all 14 real devices linked (validated against
Kyle's actual OP230 drawings); OP120 shares 2 of those same devices (Drop Deck Cylinder #1 &
#2); OP110 and OP130 exist but have no devices linked yet. Full per-device table is in
`SESSION_1_HANDOFF.md` §4.

**Every one of the 14 `devices` rows still has `part_number = "— (mechanical BOM)"` — a literal
placeholder, identical across all of them.** That is why the migration could not use
`part_number` as a join key without collapsing 14 rows into 1. **Resolved in Session 3**, not
open: each part got a synthetic `UNCAT-<STATION>-<NAME>` key flagged
`provisional_part_number = true` (Kyle's option b — see "Part numbers are synthetic and flagged"
above). `SESSION_1_HANDOFF.md` §5A describes this as an open risk; that is historical, this
section wins. Real numbers from mechanical's BOM are still outstanding as Open item 5.

Not yet built: a `controls_ref` table for per-address I/O detail (valve bank / input module /
address / signal label) — the app rolls up I/O *counts* per device but doesn't store individual
addresses the way the original OP230 artifact's `ctrl` object did.

## The sheet-count business rule (don't guess at this — it's a real spec from Kyle)

Company standard: an SMC valve bank is an 8-station manifold = 6 active double-solenoid valves
+ 2 blanks. Each bank = 2 content sheets (valve layout + inputs) + 2 spare sheets before + 2
spare sheets after = **6 sheets per bank**. Formula (`VALVES_PER_BANK=6`, `SENSOR_PTS_PER_BANK=16`,
`SHEETS_PER_BANK=6` in `lib/types.ts`, computed in `app/jobs/[jobId]/ops/[opId]/page.tsx`):

```
banks  = max(ceil(pneumatic_qty / 6), ceil(sensor_qty / 16), 1 if any devices else 0)
sheets = banks * 6
```

Validated against Kyle's real OP230 drawings (26764-EL-288/289): 14 devices → exactly 1 bank →
exactly 6 sheets, matching the real drawing set. Only `pneumatic` and `sensor` feed this formula
— `special` (and the redesign's new `robot` category) contribute no I/O to the estimate. Confirm
with Kyle whether that's intentional before the redesign ships a 4th category.

**Not yet modeled**: other sheet types (title sheets, power distribution, network topology, I/O
summary). Phase 1 estimate only; expected to grow.

## Conventions

- Design tokens (colors, type, `.pill` badges) in `app/globals.css` carry over 1:1 from the
  original artifact demo — keep new UI visually consistent with that (the redesign spec reuses
  the same tokens) rather than introducing a new look, unless Kyle explicitly asks.
- Fonts load via a plain `<link>` in `app/layout.tsx`, not `next/font/google` — a deliberate
  workaround for a build-sandbox network restriction that doesn't apply to Vercel's own builds.
  Switching to `next/font/google` would silence the `@next/next/no-page-custom-font` ESLint
  warning, but isn't urgent.
- `lib/supabase.ts` has hardcoded fallback literals for the Supabase URL/publishable key
  alongside the `NEXT_PUBLIC_*` env reads. These are meant to be public (RLS is supposed to
  enforce access, not secrecy of the anon key), so this is intentional, not a leak — env vars
  still take precedence. It does mean the RLS permissiveness above is the *actual* access
  control today.
- **Blank form fields are stored as `NULL`, never `""`.** An empty spec field means "not
  recorded", and the UI already renders NULL brands as "Brand not recorded". The design
  prototype's `"Unbranded"` fallback was deliberately not carried over — it would open a second
  group for the same concept.
- **Uploads go to the single `device-files` bucket**, keyed by prefix: `<part id>/datasheet-*`
  and `<part id>/cad-*` for part files, `images/*` for `device_images` symbols. One bucket means
  one set of storage policies to fix when auth lands.
- `design_handoff_paneliq/Hardware Library.dc.html` is a **design reference, not code**. It's a
  106KB single file with inline styles, in-memory state, and invented sample data. Recreate the
  documented values in the app's real patterns; never paste its markup into a component.

## Open items

1. **Close the RLS hole** — see the SECURITY note above. The live site is public and the
   database is world-writable through the published key. This outranks feature work; the longer
   the tool is shown to the team, the more real data sits behind an open door. Minimum viable
   fix is read-only anon policies plus writes gated behind Supabase Auth (item 4).
2. **Finish the redesign.** Build order steps 1-4 are **done** (migration, header + tab bar,
   `/library` hub + `/library/[family]`, Catalog New Part modal). Remaining: the real
   `/datasheets` `/cad` `/images` screens (step 5, currently stubs rendering "Not built yet"),
   `/jobs` with inline create (step 6), and OP Build with the naming flow, steppers and rollups
   (step 7). Validate step 7's output against OP230: 14 devices -> 1 valve bank -> 6 sheets.

   Each remaining step adds a new *write* surface — uploads, job/OP creation, OP device editing —
   to a database that is still world-writable. That is why item 1 outranks them.
3. **Rebuild OP Build, then drop `op_devices.device_id`** and the `devices` table once nothing
   reads them.
4. **Real login** (Supabase Auth) + role-based permissions + login/activity audit log. Kyle's
   actual end goal; discussed at length, not started.
5. **Catalog real part numbers** for the 14 existing devices.
6. **Sheet-count formula needs widening.** Kyle confirmed 2026-09-01 that `special` and `robot`
   parts **should** feed the sheet count eventually — deferred, not declined. Today the formula
   still counts only `pneumatic` and `sensor`. (The `robot` categorization question is settled:
   see "Categorize by the part" above.)
7. **Confirm the sheet-count rule generalizes** across jobs — stated as company standard, but
   only checked against OP230 so far.
8. Write RLS policies alongside each new table as it's created, not deferred as a batch — even a
   deliberately permissive one, written explicitly, keeps the posture visible.
9. **Should `operate: "NA"` show in the part card spec line?** It currently renders (as
   "PNP · NA"), because the spec treats `NA` as a real value distinct from "not recorded". Kyle's
   call; a one-line `PartCard` change either way.
