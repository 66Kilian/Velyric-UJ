"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getVoice } from "./voices";
import {
  parseOnboarding,
  type AiInput,
  type AnalyzeResult,
  type Billing,
  type MessagesResult,
  type OnboardingData,
  type VoiceId,
} from "./schema";

// Böngészőoldali segédek a beállításhoz: mentés, MI-hívások, hanglejátszás, fizetés.

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError("network", 0);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(data.error ?? "generic", res.status);
  }
  return (await res.json()) as T;
}

export const requestAnalyze = (input: Extract<AiInput, { action: "analyze" }>) =>
  post<AnalyzeResult>("/api/onboarding/ai", input);

export const requestMessages = (input: Extract<AiInput, { action: "messages" }>) =>
  post<MessagesResult>("/api/onboarding/ai", input);

export const startCheckout = (locale: string, billing: Billing) =>
  post<{ url: string }>("/api/billing/checkout", { locale, billing });

export const verifyCheckout = (sessionId: string) => post<{ paid: boolean }>("/api/billing/verify", { sessionId });

// ---------- Mentés: Supabase (valódi fiók) vagy a böngésző (bemutató mód) ----------

const localKey = (email: string) => `velyric-setup:${email.toLowerCase()}`;

export async function loadOnboarding(userId: string | null, email: string): Promise<OnboardingData> {
  const supabase = getSupabaseBrowser();
  if (supabase && userId) {
    const { data } = await supabase.from("onboarding").select("data").eq("user_id", userId).maybeSingle();
    return parseOnboarding(data?.data, email);
  }
  try {
    const raw = localStorage.getItem(localKey(email));
    return parseOnboarding(raw ? JSON.parse(raw) : null, email);
  } catch {
    return parseOnboarding(null, email);
  }
}

export async function saveOnboarding(userId: string | null, email: string, data: OnboardingData): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (supabase && userId) {
    const { error } = await supabase.from("onboarding").upsert({
      user_id: userId,
      data,
      completed_at: data.completedAt,
      updated_at: new Date().toISOString(),
    });
    return !error;
  }
  try {
    localStorage.setItem(localKey(email), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ---------- Tudásbázis-fájlok ----------

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const ACCEPT_ATTR = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp";

export async function uploadKnowledgeFile(userId: string, file: File): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-120);
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("knowledge").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function removeKnowledgeFile(path: string) {
  await getSupabaseBrowser()?.storage.from("knowledge").remove([path]);
}

// ---------- Hanglejátszás: természetes hang a szerverről, vagy a böngésző felolvasója ----------

const audioCache = new Map<string, string>();
let current: { stop: () => void } | null = null;

export function stopSpeaking() {
  current?.stop();
  current = null;
}

const BCP47 = { hu: "hu-HU", en: "en-GB", de: "de-DE" } as const;

function speakWithBrowser(text: string, voiceId: VoiceId, locale: keyof typeof BCP47, onEnd: () => void) {
  if (!("speechSynthesis" in window)) {
    onEnd();
    return { stop: () => {} };
  }
  const persona = getVoice(voiceId);
  const utterance = new SpeechSynthesisUtterance(text);
  const lang = BCP47[locale];
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));
  // A női/férfi hang eltalálása a rendszerhangok nevéből (ha van több)
  const femaleHint = /female|woman|frau|nő|zira|hedda|anna|katja|mária|noemi|helena|susan|hazel|libby|sonia/i;
  const maleHint = /male|man|mann|férfi|david|stefan|tamás|george|ryan|conrad|killian|markus/i;
  const match = voices.find((v) => (persona.gender === "female" ? femaleHint : maleHint).test(v.name)) ?? voices[0];
  if (match) utterance.voice = match;
  utterance.lang = lang;
  utterance.pitch = persona.pitch;
  utterance.rate = persona.rate;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return { stop: () => window.speechSynthesis.cancel() };
}

export type SpeakMode = "neural" | "browser";

// Lejátszik egy szöveget a választott hangon. Visszaadja, melyik módon szólt.
export async function speak(
  text: string,
  voiceId: VoiceId,
  locale: keyof typeof BCP47,
  onEnd: () => void,
): Promise<SpeakMode> {
  stopSpeaking();
  const key = `${voiceId}:${text}`;
  let url = audioCache.get(key);
  if (!url) {
    const res = await fetch("/api/onboarding/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice: voiceId, text }),
    }).catch(() => null);
    if (res?.status === 200) {
      url = URL.createObjectURL(await res.blob());
      audioCache.set(key, url);
    }
  }
  if (url) {
    const audio = new Audio(url);
    audio.onended = onEnd;
    audio.onerror = onEnd;
    current = {
      stop: () => {
        audio.pause();
        onEnd();
      },
    };
    await audio.play().catch(onEnd);
    return "neural";
  }
  current = speakWithBrowser(text, voiceId, locale, onEnd);
  return "browser";
}
