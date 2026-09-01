# Handoff: PanelIQ — Hardware Part Library, Document Storage & OP Build

## Overview

PanelIQ is Maris Systems Design's internal controls-engineering tool. This handoff covers a full redesign and expansion of the app around one idea:

> **The library holds part numbers, not device names.** A part is catalogued once (brand, spec, datasheet, CAD, symbol image, I/O). Device names, stations and cable tags are assigned per-OP when the part is pulled into a job.

It replaces the current `app/library/page.tsx` device list and adds four new areas: Datasheets & Manuals, CAD Files, Device Images, and a Jobs → OPs → OP Build flow with live I/O and controls-sheet rollups.

Existing repo: `kylemoyer07-design/Maris` (Next.js 16 App Router + Supabase + Tailwind v4). Supabase, GitHub and Vercel are already connected, so this is an in-place evolution of that app, not a greenfield build.

## About the Design Files

`Hardware Library.dc.html` in this bundle is a **design reference created in HTML** — a working prototype showing intended look, structure and behavior. It is **not production code to copy**. Everything is one file with inline styles and in-memory state; there is no data layer.

The task is to **recreate these designs in the existing Next.js codebase** using its established patterns: App Router pages under `app/`, client components with `"use client"`, Supabase via `lib/supabase.ts`, CSS variables from `app/globals.css`, Tailwind utility classes for layout. Lift the exact values documented below; don't port the HTML.

To view the prototype: open `Hardware Library.dc.html` in a browser (it loads a small runtime and Google Fonts; needs network access). `logo.png` must sit next to it.

## Fidelity

**High-fidelity.** Colors, typography, spacing, borders and copy are final and match the tokens already in `app/globals.css`. Recreate pixel-perfectly. All sizes below are CSS px.

---

## Data model (the important change)

### Today (repo `lib/types.ts`)

`Device` is a single flat row holding both the part (part_number, category, I/O, files) and the instance (name, station, cable_number). Devices are grouped by station in the library.

### Target

Split into **parts** (library) and **op_devices** (named instances in an OP).

```sql
-- Library: one row per part number. No device names, no stations.
create table parts (
  id            uuid primary key default gen_random_uuid(),
  part_number   text not null unique,        -- primary identity, primary sort
  brand         text not null,               -- second-most-important field; groups the library
  category      text not null,               -- 'sensor' | 'pneumatic' | 'special' | 'robot'
  type          text,                        -- e.g. 'Proximity switch'
  voltage       text,                        -- e.g. '10-30VDC'
  signal        text,                        -- 'PNP' | 'NPN' | 'NA'
  operate       text,                        -- 'Light' | 'Dark' | 'NA'
  hp            text,
  rpm           text,
  cable_pn      text,                        -- cable PART number (e.g. 7000-08041-6501000)
  pins          text,
  addl_switch   text,
  addl_cable    text,                        -- e.g. '10M PUR'
  safety        boolean not null default false,
  comm          boolean not null default false,
  std_in        int not null default 0,
  std_out       int not null default 0,
  safe_in       int not null default 0,
  safe_out      int not null default 0,
  cut_sheet     text,                        -- path/link, e.g. '..\Mechanical Design\Cut Sheets\OP230'
  controls_info text,
  notes         text,
  datasheet_path text,                       -- storage path
  cad_path       text,                       -- storage path
  image_id       uuid references device_images(id),
  created_at    timestamptz not null default now()
);

-- Symbol PDFs / photos, linked to a part number.
create table device_images (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                  -- file name, e.g. 'PRX-N.O.pdf'
  symbol     text not null,                  -- short label shown on the tile, e.g. 'PRX N.O.'
  kind       text not null,                  -- 'PDF symbol' | 'Image'
  path       text,                           -- storage path
  created_at timestamptz not null default now()
);

-- Named instance of a part inside one OP. This is where names live.
create table op_devices (
  id        uuid primary key default gen_random_uuid(),
  op_id     uuid not null references ops(id) on delete cascade,
  part_id   uuid not null references parts(id),
  name      text not null,                   -- 'Tick Tock #2 Part Present'
  station   text,                            -- 'Tick Tock'
  cable_tag text,                            -- 'TT-107'  (instance tag, NOT cable_pn)
  quantity  int not null default 1,
  sort_order int
);
```

`jobs` and `ops` stay as they are in `lib/types.ts` (`jobs.job_number`, `jobs.job_name`; `ops.job_id`, `ops.op_number`, `ops.name`).

Migration from existing `devices` rows: `distinct on (part_number)` → `parts`; every original row → an `op_devices` row (name, station, cable_number → cable_tag) against whichever OP it belonged to.

Storage buckets: keep `device-files` for datasheets/CAD; add `device-images` (or a prefix) for symbols. `getPublicUrl` as today.

Constants (already in `lib/types.ts`, keep): `VALVES_PER_BANK = 6`, `SENSOR_PTS_PER_BANK = 16`, `SHEETS_PER_BANK = 6`.

---

## Routes / screens

| Route | Screen |
| --- | --- |
| `/library` | Hardware Library hub — 4 family cards + 3 storage shortcuts |
| `/library/[family]` | Family page — parts grouped by brand (`electrical`, `pneumatic`, `special`, `robots`) |
| `/datasheets` | Datasheets & Manuals storage |
| `/cad` | CAD Files storage |
| `/images` | Device Images storage |
| `/jobs` | Jobs & OPs index |
| `/jobs/[jobId]/ops/[opId]` | OP Build (two-panel) |

Family ↔ category map: `electrical → sensor`, `pneumatic → pneumatic`, `special → special`, `robots → robot`.

---

## Global chrome

### Header (`app/layout.tsx`)
- Full width, `background #f5f6f8`, `border-bottom: 2px solid #1b222c`.
- Inner container: `max-width 1152px`, centered, `padding 12px 24px`, flex row, `space-between`, `wrap`, `gap 12px`.
- Left: the Maris logo image, `height 30px`, `width auto`, `mix-blend-mode: multiply` (the PNG has a white background), then a `12px #5b6572` subtitle "hardware part library & OP build". Logo + subtitle sit in one flex row, `align-items: center`, `gap 10px`, linking to `/library`. **The old "PanelIQ" wordmark is gone.**

### Tab bar (below the header, above page content)
- `background #f5f6f8`, `border-bottom: 1px solid #d7dce3`.
- Inner container `max-width 1024px`, `padding 0 24px`, flex, `gap 4px`, wrap.
- Tabs: **Hardware Library · Datasheets & Manuals · CAD Files · Device Images · Jobs**
- Each tab: `font-size 13px`, `font-weight 700`, `padding 10px 14px`, `margin-bottom: -1px`, `border-bottom: 2px solid transparent`.
  - Active: color `#1b222c`, `border-bottom-color #2e6f8e`.
  - Inactive: color `#5b6572`; hover color `#1b222c`.
- "Hardware Library" is active for `/library` and its family pages; "Jobs" is active for the jobs index and OP Build.

### Page shell
- Catalog-side pages: `max-width 1024px`, centered, `padding 32px 24px`.
- Jobs index and OP Build: `max-width 1150px`, same padding.
- Breadcrumb (family, datasheets, cad, images pages): monospace `12px #5b6572`, `margin-bottom 10px`, `Hardware Library` link in `#2e6f8e`, `/` separator, current leaf in `#1b222c`. OP Build breadcrumb: `Jobs & OPs / <job name> (<number>) / <OP number>`.
- Title row: flex, `space-between`, wrap, `gap 12px`, `margin-bottom 4px`. `h1` Archivo `24px/800`, `letter-spacing -0.01em`. Right side monospace `12px #5b6572` meta.
- Blurb: `14px #5b6572`, `max-width 780px`, `margin 0 0 20px`, `text-wrap: pretty`.
- Toolbar: flex, `gap 12px`, `margin-bottom 20px`. Search input `flex:1`, `padding 8px 12px`, `radius 6px`, `1px solid #d7dce3`, white fill, `14px`; focus `outline: 2px solid #2e6f8e; outline-offset: -1px; border-color: #2e6f8e`. Primary button on the right: `#2e6f8e` fill, white `14px/700`, `padding 8px 16px`, `radius 6px`, `nowrap`; hover `#1f4f66`.

---

## Screen: Hardware Library hub (`/library`)

- Title "Hardware Library"; meta `"{n} parts · shared across every job"`.
- Blurb: "The library holds part numbers, not device names. Catalog a part once — brand, spec, datasheet, CAD, I/O — then name it per station when you pull it into a job's OP."
- Search placeholder "Search by part number, brand, or type…"; button "+ Catalog New Part" (opens the modal).
- **Family cards**: `display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: 12px`. Each card is a button: white, `1px solid #d7dce3`, `radius 8px`, `padding 14px`, flex column `gap 8px`, hover `border-color #2e6f8e`. Contents top to bottom:
  1. Row (`space-between`): category pill + monospace `12px #5b6572` count.
  2. Archivo `16px/700` family name.
  3. `12px #5b6572` blurb, `line-height 1.45`.
  4. Monospace `11px #5b6572` brand line — `"{n} parts · Balluff, Banner, Turck"` or `"nothing catalogued yet"`.
  5. `12px/600 #2e6f8e` CTA — "View parts →", or "Catalog the first one →" when count is 0.

  Families and their pills: **Electrical** (`#0d6b6e` on `#e1f0f1`, border `#3a93a0`), **Pneumatic / Hydraulic** (`#5a4a86` on `#ece8f4`, border `#7c6ba6`), **Special Devices** (`#1f4f66` on `#e4eef2`, border `#2e6f8e`), **Robots** (`#2f6b4e` on `#e3f2ea`, border `#3f8f6b`).
- **Storage shortcuts** below: `grid, repeat(auto-fit, minmax(280px, 1fr)), gap 12px, margin-top 12px`. Each: `#eceff3` fill, `1px solid #d7dce3`, `radius 8px`, `padding 14px`, flex row `space-between`; left = Archivo `14px/700` title + monospace `11px #5b6572` meta, right = `12px/600 #2e6f8e` "Open storage →". Titles: Datasheets & Manuals (`"{n} files · one per part number"`), CAD Files (`"{n} blocks on file · {m} PNs missing"`), Device Images (`"{n} symbol files"`).
- Typing in the hub search hides the cards and shows the brand-grouped part list across all families.

## Screen: Family page (`/library/[family]`)

- Title = family name; meta `"{matches} of {total} parts in the library"`; family blurb; scoped search.
- **Parts grouped by brand**, brands alphabetical, parts sorted by part number (`localeCompare` with `{numeric: true, sensitivity: 'base'}`).
- Group header: full-width button, `padding 8px 0`, `border-bottom: 1px solid #d7dce3`; left label uppercase `12px/700`, `letter-spacing 0.025em`, `#5b6572`; right monospace `12px #5b6572` count. Click collapses the group.
- Part cards: `1px solid #d7dce3`, `radius 8px`, `padding 12px`, white, `gap 8px` between cards, `padding 8px 0` around the group's list.
  1. Row: monospace `14px/600` part number + pills (family pill, plus `Safety` `#7a4b04`/`#fbeed8`/border `#e8a33d` and `Comm` `#1f4f66`/`#e4eef2`/border `#2e6f8e` when set).
  2. `13px/700` brand, followed by the type in `400 #5b6572`.
  3. Monospace `12px #5b6572` spec line — voltage · signal · operate · pins · HP · RPM · `Cable P/N: …` · additional cable/switch info, joined with " · "; falls back to "No spec fields on file yet".
  4. Monospace `12px #5b6572` — `I/O: 1/0 std, 0/0 safety  ·  used in OP230 ×4` (or "· not used in an OP yet").
  5. Links row, `gap 16px`, `12px/600`: "Datasheet" → `/datasheets?q=<pn>`, "CAD file" → `/cad?q=<pn>` (or muted "No CAD file on file"), "Symbol: PRX N.O." → `/images?q=<symbol>`.

Pill style (used everywhere): `font-size 9.5px`, `font-weight 700`, `uppercase`, `letter-spacing 0.04em`, `padding 2px 7px`, `border-radius 999px`, `border 1px solid`. This matches the `.pill` class already in `app/globals.css`.

## Screen: Catalog New Part (modal)

Opened by the primary button on library pages. Backdrop `rgba(27,34,44,0.45)`, fixed inset 0, `padding 28px 20px`, scrollable, content top-aligned. Dialog: white, `max-width 780px`, `max-height calc(100vh - 56px)`, `1px solid #d7dce3`, `radius 10px`, flex column, `overflow hidden`.

- Header (fixed): Archivo `18px/800` "Catalog New Part" + `×` close.
- Body (scrolls, `padding 20px`, `gap 20px`):
  1. **Part #** (required, monospace input, placeholder `BES M08EH1-PSC60F-S49G`) + **Brand / manufacturer** — `grid 3fr 2fr`.
  2. Category segmented row — 4 equal buttons: Electrical / Pneumatic / Hyd. / Special / Robot. Selected: `border #2e6f8e`, `bg #e4eef2`, `color #1f4f66`; unselected: `border #d7dce3`, white, `#5b6572`.
  3. **Mechanical information** — Type, Voltage, PNP/NPN (segmented PNP/NPN/NA), Light / dark operate (Light/Dark/NA), HP, RPM.
  4. **Additional information — all P/N controls info required** — Cable P/N, # of pins, Additional switch information, Additional cable information.
  5. **Controls information** — "Safety-rated part" and "Network / fieldbus communication part" checkboxes (`accent-color #2e6f8e`); a 4-up grid of Std in / Std out / Safety in / Safety out (safety fields use `#fbeed8` fill and `#7a4b04` text); Cut sheet path / link (monospace, placeholder `..\Mechanical Design\Cut Sheets\OP230`); Safety / additional controls info.
  6. **Device image / symbol** — horizontal picker of existing images (104px tiles, 58px preview box, selected tile gets `border #2e6f8e`, `bg #e4eef2`) plus a dashed "+ Upload image / PDF" tile. Uploads land in `device_images` and link to this part. Helper: "Picked images land in the Device Images tab and stay linked to this part number."
  7. **Files** — Datasheet (PDF) and CAD file native file inputs.
  8. **Notes / revision** textarea, 3 rows.
- Footer (fixed): left hint — ready: "Device names, stations and cable tags get assigned when this part is added to an OP."; not ready (`#7a4b04`): "Part # is required — it's how the library is sorted and how files link." Right: "Cancel" (white, `1px solid #d7dce3`) and "Add to Library" (`#2e6f8e`).
- Section headings inside the body: uppercase `11px/700`, `letter-spacing 0.05em`, `#5b6572`, `padding-bottom 7px`, `border-bottom 1px solid #d7dce3`, `margin-bottom 12px`.
- Field labels: `12px/700`, `margin-bottom 5px`. Inputs: `padding 8px 10px`, `radius 6px`, `1px solid #d7dce3`, `13px`; monospace for part/cable/numeric fields.
- On save: insert the part, close, and navigate to that part's family page.

## Screen: Datasheets & Manuals (`/datasheets`) and CAD Files (`/cad`)

Same layout, one record **per part number**.

- Meta: `"{matches} of {total} files"` / `"{matches} of {total} part numbers"`.
- Family filter row above the list: label "Family" + pill buttons All / Electrical / Pneumatic / Hydraulic / Special / Robots (`padding 5px 10px`, `radius 999px`, `12px/600`; active `border #2e6f8e`, `bg #e4eef2`, `color #1f4f66`).
- Records grouped by **brand** (same collapsible group header as the library).
- Row card: white, `1px solid #d7dce3`, `radius 8px`, `padding 12px`, flex `space-between`, wrap.
  - Left: monospace `13px/600` filename (`<part number>.pdf` / `.dwg`, spaces → `-`), family pill, and a `Missing` pill (amber) when no file; monospace `12px #5b6572` meta (`"PDF datasheet · Proximity switch · Balluff"` or `"No CAD block on file · Turck · Inductive proximity switch"`); then `Used in:` + monospace `#2e6f8e` links `OP230 ×4` that open that OP's build screen, or "Not used in any OP yet".
  - Right: `12px/600` links — "Open PDF"/"Open in CAD" + "Download", or `#7a4b04` "Upload file" when missing.
- Primary button: "+ Upload Datasheet" / "+ Upload CAD File".

## Screen: Device Images (`/images`)

- Meta `"{n} symbol files"`; primary button "+ Upload Device Image" (multi-select, `image/*,.pdf`).
- Grid: `repeat(auto-fill, minmax(205px, 1fr))`, `gap 12px`.
- Tile: white, `1px solid #d7dce3`, `radius 8px`, `padding 10px`, flex column `gap 8px`.
  - Preview box: `aspect-ratio 4/3`, `#eceff3`, `1px solid #d7dce3`, `radius 6px`, centered. Images render (`object-fit: contain`, `mix-blend-mode: multiply`); PDFs show the monospace symbol (`15px/600`) over the monospace `10px #5b6572` kind label — replace with a real first-page render server-side if you can.
  - Monospace `12px/600` file name (`word-break: break-all`), monospace `11px #5b6572` meta `"PDF symbol · 2 parts"`.
  - Linked part numbers as monospace `11px` `#2e6f8e` links to the part's family page, or "Not linked to a part yet".
- Seeded examples: `PRX-N.O.pdf` (symbol `PRX N.O.`) linked to the Balluff and Turck prox switches; `PE-Photoeye.pdf` (symbol `PE`) linked to the Banner photoeye.

## Screen: Jobs & OPs (`/jobs`)

- Title "Jobs & OPs"; meta `"{n} jobs · {m} OPs"`; blurb "Each OP pulls its parts from the shared Hardware Library and names them here."
- "+ New Job" primary button; opens an inline form card (`1px solid #2e6f8e`, white, `radius 8px`, `padding 14px`) with a monospace Job number input (200px), a Job name input (`flex:1`), "Create job" and text "Cancel".
- Job cards: white, `1px solid #d7dce3`, `radius 8px`, `padding 16px`, `gap 12px` between cards.
  - Header row: `14px/700` job name + monospace `13px #5b6572` `(26764)`; right monospace `12px #5b6572` `"4 OPs"`.
  - OP chips row (`margin-top 12px`, `gap 12px`, wrap): each chip `#eceff3`, `1px solid #d7dce3`, `radius 6px`, `padding 9px 14px`, `13px/700 #1b222c`; hover `border #2e6f8e`, `bg #e4eef2`. Label format `OP230 — Genie OP230 — Rail Deck / Valve Bank`. Click → OP Build.
  - Last chip: "+ Add OP", `1px dashed #d7dce3`, transparent fill, `#2e6f8e` text; opens an inline OP form (OP number + OP name, "Add OP" / "Cancel") separated by a `1px solid #eceff3` top rule.
- Seed content: job **26764 — Genie Baltic Rail Assembly** with OP110, OP120, OP130, OP230.

## Screen: OP Build (`/jobs/[jobId]/ops/[opId]`)

- Title `26764 — OP230`; monospace tag = the OP's description (`Rail Deck / Valve Bank`); blurb "Pull a part from the shared library, then name it for this OP — station, device name and cable tag live here, not in the library."
- Two columns: `grid-template-columns: 1fr 1fr; gap 20px; align-items: start`. Both panels white, `1px solid #d7dce3`, `radius 8px`. Panel header: `padding 12px 14px`, `border-bottom 1px solid #d7dce3`, Archivo `15px/700` title + monospace `12px #5b6572` meta.

**Left — Hardware Library** (`"{n} parts"`)
- Search input inside the panel, `#eceff3` fill, `13px`, placeholder "Search by part number, brand, or type…".
- Scroll area `max-height 520px`, `overflow-y auto`. Rows `padding 9px 0`, `border-bottom 1px solid #eceff3`:
  - Left: monospace `13px/600` part number + family pill; monospace `11px #5b6572` meta `"Balluff · Proximity switch · I/O 1/0"`.
  - Right: `+ Add` button — `#2e6f8e`, white `12px/700`, `padding 5px 10px`, `radius 5px`.
- Clicking `+ Add` expands an inline naming form under that row: `1px solid #2e6f8e`, `#e4eef2` fill, `radius 6px`, `padding 10px`, containing the label "Name this device for OP230", a **Device name** input (required), a row with **Station / assembly** and a 110px monospace **Cable tag**, then "Add to OP" (primary), text "Cancel", and a `11px #5b6572` "Device name required" hint until a name is typed. Confirming inserts an `op_devices` row with `quantity 1`.
- Empty state inside the scroll area: "No part matches "{query}" — catalog it in the Hardware Library first." (or "No parts in the library yet — catalog one in the Hardware Library first.").

**Right — OP230 Build** (`"{n} devices named"`)
- Header also carries a **Clear all** button (`#eceff3`, `1px solid #d7dce3`, `12px/700 #5b6572`, `padding 4px 10px`, `radius 5px`; hover turns `#c1503a` on `#f7e4df`) — hidden when the build is empty. Deletes all `op_devices` for this OP.
- Rows `padding 9px 0`, `border-bottom 1px solid #eceff3`: `13px/700` device name; monospace `11px #5b6572` meta `"BANNER-QS18VP6LP · Tick Tock · Cable TT-106 · I/O 1/0"`. Right: quantity stepper — `−` and `+` are 24×24 buttons (`#eceff3`, `1px solid #d7dce3`, `radius 5px`), monospace `13px` quantity with `min-width 18px` centered, then a borderless `×` remove (`#5b6572`, hover `#c1503a`). `−` floors at 1.
- Empty state: "Nothing added yet — pick a part from the library and name it."
- **Stat tiles**: `grid 1fr 1fr`, `gap 8px`, `padding 0 14px 14px`. Each tile `#eceff3`, `1px solid #d7dce3`, `radius 6px`, `padding 10px 12px`; label uppercase `10px/700`, `letter-spacing 0.05em`, `#5b6572`; value monospace `20px/600`. Order: Std inputs, Std outputs, Safety inputs, Safety outputs — the two safety values render in `#7a4b04`.
- **Sheet callout**: `#e4eef2` fill, `1px solid #2e6f8e`, `radius 8px`, `padding 14px`, `margin 0 14px 14px`. Label uppercase `10px/700 #1f4f66` "Estimated controls sheet count"; headline Archivo `20px/800` `"6 sheets · 1 valve bank"`; support `12px #5b6572` `"1 bank × 6 sheets (2 content + 2 spare before + 2 spare after). Driven by 6 pneumatic valves (max 6/bank) and 8 sensors (max 16/bank)."` Empty-build text: "Name a part into this OP to size the controls sheet set."

### Rollup math (recompute on every change)

```
stdIn   = Σ part.std_in  × qty      stdOut  = Σ part.std_out  × qty
safeIn  = Σ part.safe_in × qty      safeOut = Σ part.safe_out × qty
valves  = Σ qty where category = 'pneumatic'
sensors = Σ qty where category = 'sensor'
banks   = max(ceil(valves / 6), ceil(sensors / 16), rows.length ? 1 : 0)
sheets  = banks × 6
```
Pluralize "sheet"/"valve bank" on count.

---

## Interactions & behavior

- **Collapsible groups** everywhere (brand groups in the library and both file pages) — click the header row to toggle; default expanded.
- **Search** is per-view and client-side in the prototype; server-side `ilike` filters are fine. Library/family search matches part number, brand, type. File pages also match OP labels. Images match file name, symbol, and linked part numbers. OP-build panel search matches part number, brand, type.
- **Cross-links**: part card → datasheet/CAD/image storage pre-filtered to that part; file record and image tile → back to the part or the OP using it. Preserve these as query params (`?q=`) so they're linkable.
- **Navigation** resets search state and scrolls to top.
- No animations beyond hover/focus transitions. Hover states: buttons darken to `#1f4f66`; cards and chips take `border-color #2e6f8e`; destructive hovers go `#c1503a`.
- Focus: `outline: 2px solid #2e6f8e; outline-offset: -1px` on inputs — do not leave browser defaults.
- Not yet designed (decide during build): auth, edit/delete of a catalogued part, reordering OP devices, actual PDF page rendering for image tiles, dark mode (the CSS variables already exist in `globals.css` but the prototype is light-only).

## Design tokens

Already in `app/globals.css` — keep using the CSS variables.

| Token | Value |
| --- | --- |
| bg | `#f5f6f8` |
| surface | `#ffffff` |
| surface-2 | `#eceff3` |
| border | `#d7dce3` |
| text | `#1b222c` |
| text-muted | `#5b6572` |
| primary | `#2e6f8e` |
| primary-dark | `#1f4f66` |
| primary-tint | `#e4eef2` |
| accent | `#e8a33d` |
| accent-ink | `#7a4b04` |
| accent-tint | `#fbeed8` |
| success / success-tint | `#3f8f6b` / `#e3f2ea` |
| danger / danger-tint | `#c1503a` / `#f7e4df` |
| Electrical pill | ink `#0d6b6e`, tint `#e1f0f1`, border `#3a93a0` |
| Pneumatic pill | ink `#5a4a86`, tint `#ece8f4`, border `#7c6ba6` |
| Robot pill | ink `#2f6b4e`, tint `#e3f2ea`, border `#3f8f6b` |
| Special pill | ink `#1f4f66`, tint `#e4eef2`, border `#2e6f8e` |

**Type** — Archivo 600/700/800 (headings, `h1` 24px/800 `-0.01em`, panel titles 15px/700, card titles 16px/700), IBM Plex Sans 400–700 (body, base 14px; secondary 13px; small 12px; micro 11px), IBM Plex Mono 400–600 (part numbers, cable tags, counts, metrics). Google Fonts link already in `app/layout.tsx`.

**Radii** — 10px dialog, 8px cards/panels, 6px inputs/buttons/tiles, 5px small buttons, 999px pills.

**Spacing** — 4 / 8 / 12 / 14 / 20 / 24 / 32. No shadows anywhere; separation is thin borders only.

## Assets

- `logo.png` — Maris Systems Design wordmark, 449×101 PNG on a white background. Rendered at 30px tall with `mix-blend-mode: multiply`. Ask the client for an SVG or transparent PNG for production.
- Icons: none used. Keep it typographic unless you add a set deliberately.
- Device symbol images (PRX N.O., PE) are placeholders standing in for the client's real symbol PDFs.

## Files

- `Hardware Library.dc.html` — the full prototype (all seven screens, the modal, and the working interactions).
- `support.js` — runtime the prototype needs; not part of the deliverable.
- `logo.png` — the logo asset.
- Source repo files this was built from: `app/library/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/jobs/page.tsx`, `lib/types.ts`, `components/DeviceForm.tsx`.

## Suggested build order

1. Migration + `parts` / `op_devices` / `device_images` tables and storage buckets; backfill from `devices`.
2. Header + tab bar in `app/layout.tsx`.
3. `/library` hub and `/library/[family]` (read-only) — this proves the part model.
4. Catalog New Part modal (replaces `components/DeviceForm.tsx`).
5. `/datasheets`, `/cad`, `/images` (they're the same list component with different record sources).
6. `/jobs` with create-job / create-OP.
7. OP Build with the naming flow, steppers, and rollups.
