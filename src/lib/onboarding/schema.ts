import { z } from "zod";

// A bejelentkezés utáni beállítás (onboarding) közös adatmodellje – a kliens és a szerver is ezt használja.
// Minden bemenetet ezekkel a sémákkal ellenőrzünk, mielőtt a szerver bármit kezdene vele.

export const STEPS = ["business", "tasks", "voice", "knowledge", "billing", "payment", "done"] as const;
export type StepKey = (typeof STEPS)[number];

export const INDUSTRY_KEYS = ["salon", "clinic", "restaurant", "auto", "other"] as const;
export type IndustryGuess = (typeof INDUSTRY_KEYS)[number];

export const VOICE_IDS = ["luca", "dora", "bence", "mate"] as const;
export type VoiceId = (typeof VOICE_IDS)[number];

export const LANGS = ["hu", "de", "en"] as const;

const text = (max: number) => z.string().trim().max(max);

// ---- Az MI által összeállított cégprofil (1. lépés eredménye) ----
export const taskSchema = z.object({
  id: text(40),
  label: text(90),
  detail: text(220),
  enabled: z.boolean(),
  custom: z.boolean().optional(),
});
export type AgentTask = z.infer<typeof taskSchema>;

export const turnSchema = z.object({ who: z.enum(["caller", "agent"]), text: text(300) });

export const profileSchema = z.object({
  businessName: text(120),
  industry: z.enum(INDUSTRY_KEYS),
  industryLabel: text(80),
  summary: text(600),
  services: z.array(text(80)).max(8),
  tips: z.object({ tasks: text(300), voice: text(300), knowledge: text(300) }),
  sampleCall: z.array(turnSchema).max(6),
});
export type BusinessProfile = z.infer<typeof profileSchema>;

// ---- Számlázási adatok ----
export const billingSchema = z.object({
  type: z.enum(["company", "individual"]),
  name: text(140),
  country: z.enum(["HU", "AT", "DE", "OTHER"]),
  taxNumber: text(20),
  euVat: text(20),
  zip: text(12),
  city: text(80),
  address: text(160),
  email: text(160),
  phone: text(30),
  accepted: z.boolean(),
});
export type Billing = z.infer<typeof billingSchema>;

// ---- A teljes beállítás állapota ----
export const onboardingSchema = z.object({
  version: z.literal(1),
  step: z.number().int().min(0).max(STEPS.length - 1),
  maxStep: z.number().int().min(0).max(STEPS.length - 1),
  business: z.object({ name: text(120), description: text(2000), website: text(200) }),
  profile: profileSchema.nullable(),
  tasks: z.array(taskSchema).max(14),
  coverage: z.enum(["always", "afterHours", "overflow"]),
  languages: z.array(z.enum(LANGS)).min(1).max(3),
  handoffPhone: text(30),
  voice: z.object({
    id: z.enum(VOICE_IDS),
    agentName: text(40),
    firstSpeaker: z.enum(["agent", "caller"]),
    formality: z.enum(["informal", "formal"]),
    greeting: text(400),
    closing: text(400),
  }),
  knowledge: z.object({
    later: z.boolean(),
    hours: text(400),
    notes: text(2000),
    files: z
      .array(z.object({ name: text(200), size: z.number().nonnegative(), path: text(400).optional() }))
      .max(20),
  }),
  billing: billingSchema,
  payment: z.object({ status: z.enum(["none", "paid", "demo"]) }),
  completedAt: z.string().max(40).nullable(),
});
export type OnboardingData = z.infer<typeof onboardingSchema>;

export function emptyOnboarding(email = ""): OnboardingData {
  return {
    version: 1,
    step: 0,
    maxStep: 0,
    business: { name: "", description: "", website: "" },
    profile: null,
    tasks: [],
    coverage: "always",
    languages: ["hu"],
    handoffPhone: "",
    voice: { id: "luca", agentName: "Luca", firstSpeaker: "agent", formality: "formal", greeting: "", closing: "" },
    knowledge: { later: false, hours: "", notes: "", files: [] },
    billing: {
      type: "company",
      name: "",
      country: "HU",
      taxNumber: "",
      euVat: "",
      zip: "",
      city: "",
      address: "",
      email,
      phone: "",
      accepted: false,
    },
    payment: { status: "none" },
    completedAt: null,
  };
}

// Mentett (esetleg régebbi / sérült) állapot biztonságos beolvasása: ami nem érvényes, az alapértékre áll
export function parseOnboarding(raw: unknown, email = ""): OnboardingData {
  const parsed = onboardingSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyOnboarding(email);
}

// ---- API-bemenetek ----
export const analyzeInputSchema = z.object({
  action: z.literal("analyze"),
  locale: z.enum(["hu", "en", "de"]),
  name: text(120),
  description: z.string().trim().min(20).max(2000),
  website: text(200),
});

export const messagesInputSchema = z.object({
  action: z.literal("messages"),
  locale: z.enum(["hu", "en", "de"]),
  businessName: text(120),
  summary: text(600),
  industry: z.enum(INDUSTRY_KEYS),
  agentName: text(40),
  formality: z.enum(["informal", "formal"]),
  firstSpeaker: z.enum(["agent", "caller"]),
  tasks: z.array(text(90)).max(14),
  instruction: text(200),
});

export const aiInputSchema = z.discriminatedUnion("action", [analyzeInputSchema, messagesInputSchema]);
export type AiInput = z.infer<typeof aiInputSchema>;

export type AnalyzeResult = { profile: BusinessProfile; tasks: AgentTask[]; greeting: string; closing: string; source: "ai" | "template" };
export type MessagesResult = { greeting: string; closing: string; source: "ai" | "template" };
