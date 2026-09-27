import type { AuthError } from "@supabase/supabase-js";

// Supabase-hibák → barátságos, fordított üzenetkulcsok (sosem mutatunk nyers hibát)
export type AuthErrorKey =
  | "invalidCredentials"
  | "notConfirmed"
  | "rateLimit"
  | "weakPassword"
  | "samePassword"
  | "network"
  | "generic";

export function authErrorKey(error: unknown): AuthErrorKey {
  const e = error as Partial<AuthError> | null;
  switch (e?.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "notConfirmed";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimit";
    case "weak_password":
      return "weakPassword";
    case "same_password":
      return "samePassword";
  }
  if (e?.status === 429) return "rateLimit";
  if (e?.name === "AuthRetryableFetchError" || error instanceof TypeError) return "network";
  if (e?.message?.includes("Invalid login credentials")) return "invalidCredentials";
  return "generic";
}

export const MIN_PASSWORD = 8;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// Jelszóerősség 0–4 (0 = üres/túl rövid)
export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (pw.length < MIN_PASSWORD) return pw.length ? 1 : 0;
  let score = 1;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 0.5;
  return Math.min(4, Math.floor(score)) as 0 | 1 | 2 | 3 | 4;
}

// A Supabase-linkek ide térnek vissza (e-mail megerősítés, jelszó-visszaállítás, Google)
export function authCallbackUrl(next: "/beallitas" | "/kezelo" | "/auth/megerosites" | "/auth/uj-jelszo", locale: string) {
  const url = new URL("/auth/confirm", window.location.origin);
  url.searchParams.set("next", next);
  url.searchParams.set("locale", locale);
  return url.toString();
}
