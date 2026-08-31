import { createClient } from "@supabase/supabase-js";

// These are Supabase's client-side "publishable" values (URL + anon key),
// meant to ship in the browser bundle — access is enforced by Row Level
// Security in the database, not by keeping these secret. The env vars are
// still the preferred source (e.g. if this project ever points at a
// different Supabase project per environment); the literals are a fallback
// so the app works even where NEXT_PUBLIC_ vars aren't configured on the host.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ohvgevtyklbjwwyfmche.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_4k-PKvkCOspt-GRZkfzQGw_xRG_8X-u";

export const supabase = createClient(url, key);
