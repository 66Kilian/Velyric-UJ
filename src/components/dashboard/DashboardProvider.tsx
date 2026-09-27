"use client";

import { useLocale } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildDemo, type DemoData } from "@/lib/dashboard/demo";
import { parseWorkspace, type Booking, type Call, type Issue, type Workspace } from "@/lib/dashboard/schema";
import { themeVars } from "@/lib/dashboard/theme";
import { dashPath } from "@/lib/dashboard/url";
import { getDemoUser } from "@/lib/demo";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding/client";
import type { OnboardingData } from "@/lib/onboarding/schema";

const SAMPLE = {
  hu: { name: "Mosoly Fogászat", label: "Fogorvosi rendelő", greeting: "Mosoly Fogászat, jó napot kívánok! Luca vagyok, mesterséges intelligencia asszisztens. Miben segíthetek?", closing: "Köszönöm, hogy hívott minket! További szép napot kívánok.", tasks: ["Időpontfoglalás", "Átfoglalás, lemondás", "Árak, kezelések", "Átkapcsolás kollégához"] },
  en: { name: "Smile Dental", label: "Dental practice", greeting: "Smile Dental, good day! I'm Luca, an AI assistant. How may I help you?", closing: "Thank you for calling us. Have a lovely day!", tasks: ["Appointment booking", "Rescheduling, cancellations", "Prices, treatments", "Transfer to a colleague"] },
  de: { name: "Praxis Lächeln", label: "Zahnarztpraxis", greeting: "Praxis Lächeln, guten Tag! Hier spricht Luca, Ihre KI-Assistenz. Wie kann ich Ihnen helfen?", closing: "Vielen Dank für Ihren Anruf. Einen schönen Tag noch!", tasks: ["Terminbuchung", "Umbuchung, Absage", "Preise, Behandlungen", "Weiterleitung an Kollegen"] },
};

function sampleOnboarding(base: OnboardingData, locale: string): OnboardingData {
  const s = SAMPLE[(locale in SAMPLE ? locale : "hu") as keyof typeof SAMPLE];
  return {
    ...base,
    business: { ...base.business, name: s.name },
    profile: { businessName: s.name, industry: "clinic", industryLabel: s.label, summary: "", services: [], tips: { tasks: "", voice: "", knowledge: "" }, sampleCall: [] },
    tasks: s.tasks.map((label, i) => ({ id: `s${i}`, label, detail: "", enabled: true })),
    voice: { ...base.voice, greeting: s.greeting, closing: s.closing },
    completedAt: new Date().toISOString(),
    step: 6,
    maxStep: 6,
  };
}
import { getSupabaseBrowser } from "@/lib/supabase/client";

// A kezelő közös állapota: ki van belépve, mit állított össze (beállítás + megjelenés),
// és a hívások / ügyek / foglalások – valódi fióknál Supabase-ből, élőben frissülve.

export type DashboardInit = {
  mode: "real" | "demo";
  base: string;
  user: { id: string; email: string } | null;
  onboarding: OnboardingData | null;
  workspace: unknown;
  data: DemoData | null;
  paid: boolean;
  aiMode?: "ai" | "template";
};

type Ctx = {
  aiMode: "ai" | "template";
  mode: "real" | "demo";
  user: { id: string; email: string };
  onboarding: OnboardingData;
  workspace: Workspace;
  calls: Call[];
  issues: Issue[];
  bookings: Booking[];
  /** Mintaadatokat mutatunk-e (bemutató mód, vagy még nincs valódi hívás) */
  sample: boolean;
  hasRealData: boolean;
  setSample: (v: boolean) => void;
  paid: boolean;
  href: (path?: string) => string;
  updateWorkspace: (patch: Partial<Workspace> | ((w: Workspace) => Workspace)) => void;
  updateOnboarding: (fn: (d: OnboardingData) => OnboardingData) => void;
  setIssueStatus: (id: string, status: Issue["status"]) => void;
  setBookingStatus: (id: string, status: Booking["status"]) => void;
  saving: boolean;
};

const DashboardContext = createContext<Ctx | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard outside provider");
  return ctx;
}

const wsKey = (email: string) => `velyric-workspace:${email.toLowerCase()}`;

export function DashboardProvider({ init, children, onUnauthenticated }: { init: DashboardInit; children: ReactNode; onUnauthenticated: () => void }) {
  const locale = useLocale();
  const [user, setUser] = useState(init.user);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(init.onboarding);
  const [workspace, setWorkspace] = useState<Workspace | null>(init.onboarding ? parseWorkspace(init.workspace, init.onboarding) : null);
  const [real, setReal] = useState<DemoData>(init.data ?? { calls: [], issues: [], bookings: [] });
  const hasRealData = init.mode === "real" && real.calls.length > 0;
  const [sample, setSample] = useState(!hasRealData);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

  // Bemutató mód: a teszt fiók és minden adata a böngészőben él
  useEffect(() => {
    if (init.mode !== "demo") return;
    const email = getDemoUser();
    if (!email) {
      onUnauthenticated();
      return;
    }
    loadOnboarding(null, email).then((loaded) => {
      // Bemutató módban (pl. külön aldomainen, ahol a böngészőtároló üres) mintacéggel indulunk
      const ob = loaded.completedAt ? loaded : sampleOnboarding(loaded, locale);
      let raw: unknown = null;
      try {
        raw = JSON.parse(localStorage.getItem(wsKey(email)) ?? "null");
      } catch {}
      setUser({ id: "demo", email });
      setOnboarding(ob);
      setWorkspace(parseWorkspace(raw, ob));
    });
  }, [init.mode, onUnauthenticated, locale]);

  // Élő frissítés: új / változó hívások és ügyek (Supabase Realtime, RLS-sel védve)
  useEffect(() => {
    if (init.mode !== "real" || !init.user) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const uid = init.user.id;
    const upsert = <T extends { id: string }>(list: T[], row: T) =>
      list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [row, ...list];
    const channel = supabase
      .channel(`dash-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "calls", filter: `user_id=eq.${uid}` }, (p) => {
        if (p.new && "id" in p.new) {
          setReal((d) => ({ ...d, calls: upsert(d.calls, p.new as Call) }));
          setSample(false);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "issues", filter: `user_id=eq.${uid}` }, (p) => {
        if (p.new && "id" in p.new) setReal((d) => ({ ...d, issues: upsert(d.issues, p.new as Issue) }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [init.mode, init.user]);

  // Munkaterület mentése (kis késleltetéssel)
  useEffect(() => {
    if (!workspace || !user) return;
    if (!loadedRef.current) {
      loadedRef.current = true;
      return;
    }
    const id = window.setTimeout(async () => {
      setSaving(true);
      if (init.mode === "real") {
        await getSupabaseBrowser()
          ?.from("workspaces")
          .upsert({ user_id: user.id, ...workspace, updated_at: new Date().toISOString() });
      } else {
        try {
          localStorage.setItem(wsKey(user.email), JSON.stringify(workspace));
        } catch {}
      }
      setSaving(false);
    }, 500);
    return () => window.clearTimeout(id);
  }, [workspace, user, init.mode]);

  const updateWorkspace = useCallback((patch: Partial<Workspace> | ((w: Workspace) => Workspace)) => {
    setWorkspace((w) => (w ? (typeof patch === "function" ? patch(w) : { ...w, ...patch }) : w));
  }, []);

  const obTimer = useRef<number | undefined>(undefined);
  const updateOnboarding = useCallback(
    (fn: (d: OnboardingData) => OnboardingData) => {
      setOnboarding((d) => {
        if (!d) return d;
        const next = fn(d);
        window.clearTimeout(obTimer.current);
        obTimer.current = window.setTimeout(() => {
          if (user) void saveOnboarding(init.mode === "real" ? user.id : null, user.email, next);
        }, 600);
        return next;
      });
    },
    [user, init.mode],
  );

  const demo = useMemo(
    () => (workspace && onboarding ? buildDemo(workspace.prefs.kind, locale, onboarding) : null),
    [workspace?.prefs.kind, locale, onboarding?.profile], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [demoState, setDemoState] = useState<DemoData | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDemoState(demo));
    return () => cancelAnimationFrame(id);
  }, [demo]);

  const showSample = init.mode === "demo" || sample;
  const source = showSample ? demoState : real;

  const setIssueStatus = useCallback(
    (id: string, status: Issue["status"]) => {
      const patch = (list: Issue[]) =>
        list.map((i) => (i.id === id ? { ...i, status, resolved_at: status === "resolved" ? new Date().toISOString() : null } : i));
      if (showSample) setDemoState((d) => (d ? { ...d, issues: patch(d.issues) } : d));
      else {
        setReal((d) => ({ ...d, issues: patch(d.issues) }));
        void getSupabaseBrowser()?.from("issues").update({ status }).eq("id", id);
      }
    },
    [showSample],
  );

  const setBookingStatus = useCallback(
    (id: string, status: Booking["status"]) => {
      const patch = (list: Booking[]) => list.map((b) => (b.id === id ? { ...b, status } : b));
      if (showSample) setDemoState((d) => (d ? { ...d, bookings: patch(d.bookings) } : d));
      else {
        setReal((d) => ({ ...d, bookings: patch(d.bookings) }));
        void getSupabaseBrowser()?.from("bookings").update({ status }).eq("id", id);
      }
    },
    [showSample],
  );

  const href = useCallback((path = "/") => dashPath(locale, init.base, path), [locale, init.base]);

  if (!user || !onboarding || !workspace || !source) {
    return <div className="min-h-dvh bg-[#0c0a10]" aria-busy="true" />;
  }

  const value: Ctx = {
    aiMode: init.aiMode ?? "template",
    mode: init.mode,
    user,
    onboarding,
    workspace,
    calls: source.calls,
    issues: source.issues,
    bookings: source.bookings,
    sample: showSample,
    hasRealData,
    setSample,
    paid: init.paid,
    href,
    updateWorkspace,
    updateOnboarding,
    setIssueStatus,
    setBookingStatus,
    saving,
  };

  return (
    <DashboardContext.Provider value={value}>
      <div data-dash="" data-style={workspace.prefs.style} data-mode={workspace.prefs.mode} style={themeVars(workspace.prefs)} className="min-h-dvh bg-canvas font-sans text-ink">
        {children}
      </div>
    </DashboardContext.Provider>
  );
}
