import { isSupabaseConfigured } from "./supabase/config";

// BEMUTATÓ MÓD – amíg nincs Supabase beállítva, ezzel a teszt fiókkal lehet belépni.
// A Supabase kulcsok megadása után AUTOMATIKUSAN kikapcsol (élesben nincs kiskapu).
// Csak a böngészőben él, mögötte nincs valódi fiók vagy adat.
export const DEMO_ENABLED = !isSupabaseConfigured;

const DEMO_EMAIL = "test123@gmail.com";
const DEMO_PASSWORD = "test123";
const STORAGE_KEY = "velyric-demo-session";
const EVENT = "velyric-demo-auth";

const notify = () => window.dispatchEvent(new Event(EVENT));

export function demoSignIn(email: string, password: string) {
  if (!DEMO_ENABLED) return false;
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) return false;
  try {
    localStorage.setItem(STORAGE_KEY, DEMO_EMAIL);
  } catch {}
  notify();
  return true;
}

export function demoSignOut() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  notify();
}

export function getDemoUser(): string | null {
  if (!DEMO_ENABLED) return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function subscribeDemo(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
