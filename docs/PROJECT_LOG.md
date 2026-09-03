# PanelIQ — Session Log

Append-only running history. **Newest entry first.** Written at the end of every working
session (Kyle says "session ended" → Claude writes the entry, refreshes `CLAUDE.md`, commits).

`CLAUDE.md` at the repo root is the short *current state* reference and loads automatically.
This file is the *how we got here*. `SESSION_1_HANDOFF.md` is the long
one-time briefing from the original Cowork session.

The entry template is at the bottom of this file.

---

## Session 4 — 2026-09-03 (Claude Code)

**Goal:** Build redesign step 4 — the Catalog New Part modal — and push everything live.

**What changed:**

- **`components/CatalogPartModal.tsx`** (new, ~900 lines): the modal, built section by section
  against the handoff spec. Part # + brand at 3fr/2fr, the four-way category segment, mechanical
  info with the PNP/NPN and Light/Dark segmented rows, additional P/N info, controls info with
  amber safety I/O fields, the device image / symbol picker, datasheet + CAD upload, notes.
  Writes to `parts`, not `devices`.
- **Wired into both library pages.** `/library`'s disabled placeholder button is now live;
  `/library/[family]` gained the same button with its own family pre-selected.
- **`components/DeviceForm.tsx` deleted.** Nothing imported it and it wrote to the legacy
  `devices` table.
- **`eslint.config.mjs`**: `design_handoff_paneliq/**` added to `globalIgnores`.
- **`.claude/launch.json`** added so the browser preview tool can start the dev server.
- Commit `53824db` pushed to `main`; Vercel auto-deployed and the modal was confirmed working on
  `https://paneliq-five.vercel.app`.

**Decisions made:**

- **Blank fields store `NULL`, not `""`.** The prototype defaults an empty brand to
  `"Unbranded"`; rejected, because `groupByBrand` already renders NULL brands as "Brand not
  recorded" and all 14 existing parts are NULL. `"Unbranded"` would have opened a second group
  for the same concept, and the drift would only show up once someone catalogued a part without
  a brand.
- **Device images upload on pick, not on save.** `device_images` rows stand on their own and are
  shared across parts, so they do not need the part id that the datasheet/CAD paths do. They
  land under an `images/` prefix inside the existing `device-files` bucket rather than a second
  bucket — the spec explicitly allows either, and one bucket means one set of storage policies
  to fix when auth lands.
- **Duplicate part number (unique violation `23505`) gets a written message** — "`<PN>` is
  already in the library." — and the modal stays open with the form intact. A raw PostgREST
  error string in front of an engineer cataloguing parts is a dead end.
- **Cross-family save follows the part.** If a part catalogued from `/library/pneumatic` is
  categorised as a sensor, the save routes to `/library/electrical`. Leaving someone on a page
  that structurally cannot show what they just created reads as a failed save.
- **Deleted `DeviceForm` rather than leaving it parked.** It was the one remaining writer to
  `devices`. An unused file is harmless; an unused file that writes to the table you are
  retiring is a trap for whoever wires up a "+ Add" button next.
- **`operate: "NA"` still renders in the part card spec line** (as "PNP · NA"). Per the spec's
  data model `NA` is a real value, distinct from "not recorded" — an engineer saying "light/dark
  operate does not apply here" is information. Flagged to Kyle as a one-line `PartCard` change
  if he would rather it stayed invisible.

**What broke / surprised us:**

- **`react-hooks/set-state-in-effect` rejected the obvious refactor.** Extracting the data load
  into a `useCallback` and calling it from the effect is an error under Next 16's lint config,
  because the linter treats any function containing `setState` as a synchronous setState in the
  effect body — regardless of the `await` inside it. The fix was to keep the inline `.then()`
  effect exactly as the hub page has it and add a separate plain `refresh` used only by the
  modal's `onSaved`. Slight duplication, but the lint rule is right about the general case.
- **`next-env.d.ts` churns between `next build` and `next dev`** — build points it at
  `.next/types`, dev at `.next/dev/types`, so whichever ran last dirties the tree. Kept out of
  the commit. Incidentally it confirms **`typedRoutes` is on**, which is why Session 3 needed
  the route stubs even though `next.config.ts` never sets the flag.
- **Deploy verification nearly produced a false negative.** Production chunk paths are
  `/_next/static/immutable/chunks/`, not `/_next/static/chunks/`, so a grep for the new code in
  the JS bundles found zero chunks and looked like a failed deploy. The check that actually
  works is simpler than bundle-grepping: **fetch the prerendered HTML and grep for markup only
  the new code produces** — here, the enabled button's exact inline styles, which the old
  disabled version could not have emitted. Absence-based checks ("the old string is gone") are
  weaker and should not be trusted alone.
- **The first click on the production modal did nothing** — it landed before hydration finished.
  Not a bug, but worth knowing before concluding a deployed interaction is broken.

**Open questions / blockers:**

1. **RLS is now the gating item, not a background one.** Steps 5-7 each add new write surfaces
   (file uploads, job/OP creation, OP device editing) to a database that is still world-writable
   through the published key. Every step from here makes the exposure larger.
2. Real part numbers from mechanical's BOM, to replace the 14 `UNCAT-` keys.
3. Whether `NA` should render in the part card spec line — Kyle's call, one line either way.

**Next step:** build-order step 5 — the real `/datasheets`, `/cad` and `/images` screens, which
are the same list component over three record sources. Then step 6 (`/jobs` with inline create)
and step 7 (OP Build), validating step 7 against OP230: 14 devices -> 1 valve bank -> 6 sheets.

---

## Session 3 — 2026-09-01 (Claude Code)

**Goal:** Implement the Claude Design handoff and get it live on Vercel. Ended up also fixing
two wrong beliefs about the deployment pipeline that had been carried since Session 1.

**What changed:**

- **Deploy canary shipped** (build-order step 2): the real Maris logo replaces the PanelIQ
  wordmark, the five-tab bar sits under the header, and `/datasheets`, `/cad`, `/images` exist
  as honest "Not built yet" stubs. The stubs were *required*, not cosmetic — typed routes are
  enabled, so a `<Link>` to a nonexistent route is a compile error, not a 404.
- **Kyle installed Node 24 / npm 11**, so local `npm run build` works. Every push after that was
  typechecked first. No failed Vercel builds all session.
- **Migration applied** (step 1): `parts` and `device_images` created, `op_devices` extended
  with `part_id` / `name` / `station` / `cable_tag` / `sort_order`. Additive throughout —
  `devices` untouched, `device_id` still NOT NULL — so the un-rebuilt pages kept working.
  Result: 14 parts, 14 distinct part numbers, 16 OP instances linked and named, 0 rows lost.
- **`/library` hub and `/library/[family]` rebuilt** (step 3) against the new `parts` table, with
  shared `PartCard` / `BrandGroup` components and a `lib/parts.ts` data layer.
- **Docs corrected twice** (see below) and `CLAUDE.md` brought current: new data model, the
  part-number decision, the categorization rule, Node now installed.
- **Memory:** added the categorize-by-part-number rule at Kyle's explicit request; updated the
  role/workflow memory, which had gone stale the moment Node was installed.

**Decisions made:**

- **Synthetic part numbers (Kyle's option b).** Each device gets `UNCAT-<STATION>-<NAME>` with
  `provisional_part_number = true`, shown as an amber "Uncatalogued P/N" pill. Chosen over
  waiting for mechanical's BOM (blocks everything) or the spec's `distinct on (part_number)`
  (collapses 14 rows into 1). Re-runnable when real numbers arrive.
- **Three schema additions beyond the spec**, all to avoid losing information:
  `provisional_part_number` so the placeholder state is visible rather than implied;
  `legacy_device_id` for provenance; `legacy_spec` holding the original jsonb, since `advance` /
  `retract` / `valveType` have no home in the new columns yet. `brand` made nullable — the spec
  says NOT NULL but no brand data exists on the real rows.
- **Categorize by the part, never the device name** — Kyle's standing rule, now in `CLAUDE.md`
  and memory. `Robot 1 Load Rail PRX` stays a `sensor` because the part is a prox switch; the
  robot association belongs to the OP instance.
- **Phased delivery.** The full 7-screen redesign was assessed as too large for one session even
  with a working compiler. Stopped at a clean checkpoint after step 3 rather than starting the
  modal and dying mid-way. The additive migration is what makes stopping safe.
- **RLS on the new tables written permissive, deliberately.** Matching the existing tables keeps
  the app working; writing the policy explicitly rather than inheriting it keeps the hole visible.

**What broke / surprised us:**

- **Claude got the Vercel situation wrong, twice, and pushed a "correction" that was itself
  wrong.** First it concluded from three unreachable hostnames plus an empty connector response
  that the site was behind a login wall and GitHub was disconnected — and committed that to
  `CLAUDE.md` as verified fact. Kyle's dashboard screenshot disproved it: the production alias is
  **`paneliq-five.vercel.app`** (the `-five` because plain `paneliq.vercel.app` was taken), it is
  public, GitHub has always been connected, auto-deploy has always worked, and Root Directory was
  never stale. **Two root causes worth not repeating: guessing at a hostname instead of finding
  it, and treating a connector's lack of permission as evidence about the world.** The reliable
  check — `curl` the production URL and grep for something only the new code contains — is now
  documented in `CLAUDE.md`.
- **Consequence: the RLS hole was live the whole time, not mitigated.** Sessions 1 and 2 both
  recorded the permissive policies as partly covered by a Vercel login wall that never existed on
  production. Confirmed by an unauthenticated request returning real device rows with only the
  published key. Promoted to Open item 1.
- `ops.op_number` stores `"230"`, not `"OP230"` — the UI labels needed normalizing. Small, but
  the kind of thing only real data reveals.
- `SESSION_1_HANDOFF.md` moved from `Session Handoffs/` to the repo root mid-session, externally.
  Git recorded the rename and it was swept into a commit before being noticed; doc pointers were
  updated to match.

**Open questions / blockers:**

1. **RLS / auth** (Open item 1). The site is public and the database is world-writable through
   the published key. Kyle confirmed he has **not shared the URL with anyone**, so today's risk
   is obscurity-based and tolerable — but the link must not go to the team until auth exists.
   The non-breaking fix is Supabase Auth, which was already Kyle's stated end goal.
2. Real part numbers from mechanical's BOM, to replace the 14 `UNCAT-` keys.
3. Sheet-count formula should eventually include `special` and `robot` — Kyle confirmed this is
   wanted, deferred to step 7, not declined.

**Next step:** build-order step 4 — the Catalog New Part modal, replacing
`components/DeviceForm.tsx`. Then steps 5-7 (real storage screens, `/jobs` with inline create,
OP Build). Validate step 7 against OP230: 14 devices -> 1 valve bank -> 6 sheets.

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
- Wrote the third context layer: three memory files plus `MEMORY.md` in
  `~/.claude/projects/-Users-kylemoyer-Maris/memory/` — Kyle's role and working style, the rule
  that controls-domain decisions are his call, and his preference for blockers-first
  communication. Machine-local, not in git.
- Documented the whole three-layer system in `CLAUDE.md` with an explicit routing rule for where
  a new fact belongs, plus guidance on maintaining memory over time. Caught because neither
  `CLAUDE.md` nor this log mentioned the memory layer existed — a future session would have
  loaded those memories silently with nothing explaining where they came from.
- `SESSION_1_HANDOFF.md` moved from `Session Handoffs/` to the repo root mid-session (not by
  Claude — the folder was emptied and removed externally, most likely by Kyle tidying up). Git
  recorded it as a rename; all pointers to the old path in `CLAUDE.md` and this file were
  updated to match. The `Session Handoffs/` directory no longer exists.
- Recorded two tooling facts future sessions would otherwise rediscover the hard way: the `gh`
  CLI is not installed (no PR workflow — work goes straight to `main`), and `list_deployments`
  on the Vercel connector is additionally blocked by the permission classifier.

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
- **Memory holds the working relationship, not project state.** Deliberately kept the memory
  files narrow — no Supabase IDs, no schema, no business rules, all of which are already in
  `CLAUDE.md`. Duplicating project facts into memory creates two copies that drift apart, and
  memory doesn't travel to another machine or to Cowork/claude.ai, so anything the team or
  another surface needs has to live in the repo. The routing rule in `CLAUDE.md` exists to keep
  this boundary from eroding.
- **Past handoffs get verified, not quoted.** Enough of Session 1's assertions turned out stale
  (see the table above) that "verify before you trust" is now written into `CLAUDE.md` as a
  standing convention rather than a one-time observation.

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

> Reconstructed from `SESSION_1_HANDOFF.md` during Session 2 — this entry was
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
