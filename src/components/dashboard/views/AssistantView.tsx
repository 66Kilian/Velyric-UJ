"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Guide } from "@/components/setup/Guide";
import { KnowledgeStep } from "@/components/setup/steps/KnowledgeStep";
import { TasksStep } from "@/components/setup/steps/TasksStep";
import { VoiceStep } from "@/components/setup/steps/VoiceStep";
import type { Update } from "@/components/setup/types";
import { cn } from "@/lib/cn";
import { useDashboard } from "../DashboardProvider";
import { PageHeader } from "../kit";

const TABS = ["tasks", "voice", "knowledge"] as const;

// ASSZISZTENS – itt bővíti és módosítja a felhasználó az asszisztense tudását
// (ugyanazokkal az elemekkel, mint a beállításnál; minden változás azonnal mentődik)
export function AssistantView() {
  const t = useTranslations("dash.assistant");
  const { onboarding, updateOnboarding, mode, user, aiMode, saving } = useDashboard();
  const [tab, setTab] = useState<(typeof TABS)[number]>("tasks");
  const [, setSpeaking] = useState(false);
  const update: Update = (fn) => updateOnboarding(fn);
  const common = { data: onboarding, update, aiMode, userId: mode === "real" ? user.id : null, goTo: () => {} };
  const tip = onboarding.profile?.tips[tab];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title", { name: onboarding.voice.agentName })} text={t("text")} actions={<span className="text-xs text-muted" aria-live="polite">{saving ? t("saving") : t("autosave")}</span>} />
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={t("title", { name: onboarding.voice.agentName })}>
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition-colors", tab === k ? "bg-cta text-white" : "border border-line-strong text-muted hover:text-ink")}>
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>
      <div key={tab} className="rise-in dash-panel flex flex-col gap-8 rounded-media border border-line bg-surface/80 p-5 shadow-float backdrop-blur-xl sm:p-8">
        {tip && <Guide text={tip} />}
        {tab === "tasks" && <TasksStep {...common} showErrors={false} />}
        {tab === "voice" && <VoiceStep {...common} showErrors={false} onSpeaking={setSpeaking} />}
        {tab === "knowledge" && <KnowledgeStep {...common} />}
      </div>
    </div>
  );
}
