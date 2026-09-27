"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spotlight } from "./Spotlight";

// BEMUTATÓ TÚRA az első belépéskor: elhomályosított háttér, kiemelt elem, nyíl + buborék.
// Tovább / Vissza / Átugrás – bármikor újraindítható a Súgóból.
const STEPS = ["assistant", "live", "stats", "issues", "calls", "settings", "help"] as const;
const TARGET: Record<(typeof STEPS)[number], string> = {
  assistant: "nav-assistant",
  live: "w-live",
  stats: "w-stats",
  issues: "nav-issues",
  calls: "nav-calls",
  settings: "nav-settings",
  help: "help-dock",
};

export function Tour({ onDone, issuesLabel }: { onDone: () => void; issuesLabel: string }) {
  const t = useTranslations("dash.tour");
  const [steps, setSteps] = useState<(typeof STEPS)[number][]>([]);
  const [i, setI] = useState(0);

  // Csak azokat a lépéseket mutatjuk, amelyek eleme látszik (pl. ha egy dobozt kikapcsolt)
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSteps(STEPS.filter((s) => Array.from(document.querySelectorAll(`[data-tour="${TARGET[s]}"]`)).some((x) => x.getClientRects().length > 0)));
    }, 350);
    return () => window.clearTimeout(id);
  }, []);

  if (!steps.length) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <Spotlight target={TARGET[step]} onClose={onDone} label={t("label")} closeLabel={t("skip")}>
      <p className="tabular text-xs font-semibold tracking-[0.14em] text-accent-ink uppercase">
        {t("progress", { current: i + 1, total: steps.length })}
      </p>
      <h2 className="mt-2 pr-8 font-display text-xl font-bold tracking-tight">{t(`${step}.title`, { issues: issuesLabel })}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${step}.text`, { issues: issuesLabel })}</p>
      <div className="mt-5 flex h-1 gap-1" aria-hidden="true">
        {steps.map((s, j) => (
          <span key={s} className={j <= i ? "flex-1 rounded-full bg-brand" : "flex-1 rounded-full bg-line-strong"} />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button type="button" onClick={onDone} className="min-h-10 px-1 text-sm font-medium text-muted hover:text-ink">
          {t("skip")}
        </button>
        <div className="flex items-center gap-2">
          {i > 0 && (
            <Button variant="secondary" onClick={() => setI(i - 1)} className="h-10 px-3" aria-label={t("back")}>
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
          )}
          <Button onClick={() => (last ? onDone() : setI(i + 1))} className="h-10">
            {last ? t("finish") : t("next")}
            {!last && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Spotlight>
  );
}
