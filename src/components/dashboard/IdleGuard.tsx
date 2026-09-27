"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { demoSignOut } from "@/lib/demo";
import { getSupabaseBrowser } from "@/lib/supabase/client";

// Automatikus kijelentkeztetés tétlenség után (a Beállításokban állítható, alapból 30 perc).
// Egy perccel előtte figyelmeztet – ha valaki a gépnél felejti a kezelőt, más nem fér hozzá.
export function IdleGuard({ minutes, loginHref }: { minutes: number; loginHref: string }) {
  const t = useTranslations("dash.idle");
  const [warning, setWarning] = useState(false);
  const [left, setLeft] = useState(60);
  const last = useRef(0);

  useEffect(() => {
    if (!minutes) return;
    last.current = Date.now();
    const bump = () => {
      last.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = window.setInterval(async () => {
      const idle = (Date.now() - last.current) / 1000;
      const limit = minutes * 60;
      if (idle >= limit) {
        window.clearInterval(id);
        demoSignOut();
        await getSupabaseBrowser()?.auth.signOut();
        // Teljes újratöltés: a kiléptetett munkamenet semmilyen állapota ne maradjon a memóriában
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`${loginHref}?lejart=1`);
      } else if (idle >= limit - 60) {
        setWarning(true);
        setLeft(Math.ceil(limit - idle));
      } else setWarning(false);
    }, 1000);
    return () => {
      window.clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [minutes, loginHref]);

  if (!warning) return null;
  return (
    <div role="alertdialog" aria-live="assertive" className="fixed inset-x-4 bottom-24 z-[90] mx-auto max-w-md rounded-panel border border-line-strong bg-surface p-5 shadow-lift lg:bottom-8">
      <p className="font-semibold">{t("title")}</p>
      <p className="mt-1 text-sm text-muted">{t("text", { seconds: left })}</p>
      <Button
        className="mt-4 h-10"
        onClick={() => {
          last.current = Date.now();
          setWarning(false);
        }}
      >
        {t("stay")}
      </Button>
    </div>
  );
}
