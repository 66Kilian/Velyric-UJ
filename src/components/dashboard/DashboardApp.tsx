"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { dashPath } from "@/lib/dashboard/url";
import { DashboardProvider, useDashboard, type DashboardInit } from "./DashboardProvider";
import { HelpDock } from "./HelpDock";
import { IdleGuard } from "./IdleGuard";
import { Shell, useKindLabels } from "./Shell";
import { Studio } from "./Studio";
import { Tour } from "./Tour";

// A kezelő: állapot + első belépéskor Stúdió, utána bemutató túra; mindig ott a Súgó
export function DashboardApp({ init, children, aiMode, setupUrl }: { init: DashboardInit; children: ReactNode; aiMode: "ai" | "template"; setupUrl: string }) {
  const locale = useLocale();
  const loginHref = dashPath(locale, init.base, "/belepes");
  const onUnauthenticated = useCallback(() => window.location.assign(loginHref), [loginHref]);
  return (
    <DashboardProvider init={{ ...init, aiMode }} onUnauthenticated={onUnauthenticated}>
      <Gate loginHref={loginHref} setupUrl={setupUrl}>
        {children}
      </Gate>
    </DashboardProvider>
  );
}

function Gate({ children, loginHref, setupUrl }: { children: ReactNode; loginHref: string; setupUrl: string }) {
  const { workspace, updateWorkspace, onboarding, mode } = useDashboard();
  const labels = useKindLabels();
  const [touring, setTouring] = useState(false);

  // Valódi fióknál a szerver már ellenőrizte; ez csak biztonsági háló
  useEffect(() => {
    if (mode === "real" && !onboarding.completedAt) window.location.assign(setupUrl);
  }, [mode, onboarding.completedAt, setupUrl]);

  // Első belépés után (Stúdió kész, túra még nem) automatikusan indul a túra
  useEffect(() => {
    if (workspace.studio_done && !workspace.tour_done) {
      const id = window.setTimeout(() => setTouring(true), 600);
      return () => window.clearTimeout(id);
    }
  }, [workspace.studio_done, workspace.tour_done]);

  if (!workspace.studio_done) return <Studio onDone={() => window.scrollTo({ top: 0 })} />;

  return (
    <>
      <Shell loginHref={loginHref}>{children}</Shell>
      <HelpDock onRestartTour={() => setTouring(true)} />
      {touring && (
        <Tour
          issuesLabel={labels.issues}
          onDone={() => {
            setTouring(false);
            updateWorkspace({ tour_done: true });
          }}
        />
      )}
      <IdleGuard minutes={workspace.idle_minutes} loginHref={loginHref} />
    </>
  );
}
