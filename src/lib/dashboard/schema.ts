import { z } from "zod";
import type { OnboardingData } from "@/lib/onboarding/schema";

// A kezelőfelület adatmodellje: megjelenés (a felhasználó állítja össze), hívások, ügyek, foglalások.

export const STYLES = ["modern", "classic", "minimal"] as const;
export const MODES = ["dark", "light"] as const;
export const ACCENTS = ["rose", "champagne", "emerald", "sapphire", "amethyst", "coral"] as const;
export const WIDGETS = ["live", "stats", "issues", "bookings", "calls", "volume", "topics", "assistant"] as const;
export type WidgetKey = (typeof WIDGETS)[number];

// A vállalkozás jellege szerint mást mutat a kezelő:
// időpontok (rendelő, szalon, szerviz) · asztalfoglalás (étterem) · ügyek megoldva/nincs megoldva (pl. tech cég)
export const KINDS = ["appointments", "reservations", "cases"] as const;
export type BusinessKind = (typeof KINDS)[number];

export const prefsSchema = z.object({
  style: z.enum(STYLES),
  mode: z.enum(MODES),
  accent: z.enum(ACCENTS),
  widgets: z.array(z.enum(WIDGETS)).max(WIDGETS.length),
  kind: z.enum(KINDS),
  density: z.enum(["comfortable", "compact"]),
});
export type Prefs = z.infer<typeof prefsSchema>;

export const workspaceSchema = z.object({
  prefs: prefsSchema,
  studio_done: z.boolean(),
  tour_done: z.boolean(),
  dpa_version: z.string().nullable(),
  dpa_accepted_at: z.string().nullable(),
  retention_days: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365)]),
  idle_minutes: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(60)]),
  notify: z.object({ newIssue: z.boolean(), dailySummary: z.boolean(), missedCall: z.boolean() }),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const DPA_VERSION = "2026-09";

// A vállalkozás jellegének kitalálása a beállításból (később a Beállításokban módosítható)
export function guessKind(onboarding: OnboardingData | null): BusinessKind {
  const industry = onboarding?.profile?.industry;
  if (industry === "restaurant") return "reservations";
  if (industry === "clinic" || industry === "salon" || industry === "auto") return "appointments";
  const text = [onboarding?.business.description, ...(onboarding?.tasks.filter((t) => t.enabled).map((t) => t.label) ?? [])]
    .join(" ")
    .toLowerCase();
  if (/asztal|table|tisch|restaurant|étterem/.test(text)) return "reservations";
  if (/időpont|foglal|appointment|booking|termin/.test(text)) return "appointments";
  return "cases";
}

export function defaultWidgets(kind: BusinessKind): WidgetKey[] {
  return kind === "cases"
    ? ["live", "stats", "issues", "calls", "topics", "volume"]
    : ["live", "stats", "bookings", "issues", "calls", "volume"];
}

export function defaultWorkspace(onboarding: OnboardingData | null): Workspace {
  const kind = guessKind(onboarding);
  return {
    prefs: { style: "modern", mode: "dark", accent: "rose", widgets: defaultWidgets(kind), kind, density: "comfortable" },
    studio_done: false,
    tour_done: false,
    dpa_version: null,
    dpa_accepted_at: null,
    retention_days: 90,
    idle_minutes: 30,
    notify: { newIssue: true, dailySummary: true, missedCall: true },
  };
}

export function parseWorkspace(raw: unknown, onboarding: OnboardingData | null): Workspace {
  const base = defaultWorkspace(onboarding);
  if (!raw || typeof raw !== "object") return base;
  const merged = { ...base, ...(raw as object) } as Record<string, unknown>;
  merged.prefs = { ...base.prefs, ...((raw as { prefs?: object }).prefs ?? {}) };
  merged.notify = { ...base.notify, ...((raw as { notify?: object }).notify ?? {}) };
  const parsed = workspaceSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}

// ---- Hívás, ügy, foglalás (ahogy a kezelő látja) ----
export type TranscriptTurn = { who: "caller" | "agent"; text: string };

export type Call = {
  id: string;
  status: "active" | "completed" | "missed" | "transferred";
  started_at: string;
  ended_at: string | null;
  caller_number: string | null;
  caller_name: string | null;
  summary: string | null;
  category: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  outcome: "resolved" | "booked" | "transferred" | "callback" | "unresolved" | null;
  transcript: TranscriptTurn[] | null;
};

export type Issue = {
  id: string;
  call_id: string | null;
  title: string;
  detail: string | null;
  category: string | null;
  priority: "low" | "normal" | "high";
  status: "open" | "resolved";
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type Booking = {
  id: string;
  call_id: string | null;
  starts_at: string;
  service: string | null;
  party_size: number | null;
  name: string | null;
  phone: string | null;
  notes: string | null;
  status: "confirmed" | "pending" | "cancelled";
};

// Telefonszám maszkolása a listákban (csak a részletek nézetben látszik teljesen)
export const maskPhone = (phone: string | null) =>
  phone ? phone.replace(/(\+?\d{2})[\d\s-]+(\d{2})$/, "$1 ··· ··· $2") : null;
