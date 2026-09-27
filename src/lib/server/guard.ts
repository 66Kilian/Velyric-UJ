import "server-only";
import type { NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

// Közös védelem az API-végpontokhoz: ki hívja (hitelesített felhasználó), honnan (saját oldal),
// és milyen gyakran (egyszerű sebességkorlát).

export type ApiUser = { id: string; email: string | null; demo: boolean };

// Bemutató mód: amíg nincs Supabase, a bejelentkezés csak a böngészőben él, így a szerver
// nem tudja ellenőrizni. Költséges (MI, hang) végpont ilyenkor csak kifejezett engedéllyel fut.
export const demoApiAllowed = !isSupabaseConfigured && process.env.DEMO_AI_ENABLED === "1";

export async function getApiUser(): Promise<ApiUser | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: data.claims.sub, email, demo: false };
}

// Valódi felhasználó, vagy (engedélyezett bemutató módban) egy IP-hez kötött vendég
export async function getApiUserOrDemo(request: NextRequest): Promise<ApiUser | null> {
  const user = await getApiUser();
  if (user) return user;
  if (demoApiAllowed) return { id: `demo:${clientIp(request)}`, email: null, demo: true };
  return null;
}

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

// CSRF ellen: állapotot módosító kérés csak a saját oldalunkról jöhet
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

// Csúszóablakos sebességkorlát (példányonként, memóriában). Szerver nélküli futtatásnál
// példányonként számol – elsődleges védelemnek a hitelesítés és a szolgáltatói limitek számítanak.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function readJson(request: NextRequest, maxBytes = 32_000): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error("too_large");
  return JSON.parse(raw);
}
