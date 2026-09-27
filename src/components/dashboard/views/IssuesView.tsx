"use client";

import { Check, CircleCheckBig, Phone, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { maskPhone, type Call } from "@/lib/dashboard/schema";
import { useDashboard } from "../DashboardProvider";
import { CallDrawer, Empty, PageHeader, PriorityDot, SampleBanner, useFormat } from "../kit";
import { useKindLabels } from "../Shell";

// ÜGYEK / TEENDŐK – amit az MI a hívásokból kiszedett; megoldva / nincs megoldva
export function IssuesView() {
  const t = useTranslations("dash.issues");
  const { issues, calls, setIssueStatus } = useDashboard();
  const labels = useKindLabels();
  const f = useFormat();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [call, setCall] = useState<Call | null>(null);
  const list = issues.filter((i) => i.status === tab);
  const counts = { open: issues.filter((i) => i.status === "open").length, resolved: issues.filter((i) => i.status === "resolved").length };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={labels.issues} text={t("text")} />
      <SampleBanner />
      <div className="flex gap-1" role="tablist" aria-label={labels.issues}>
        {(["open", "resolved"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("h-10 rounded-full px-4 text-sm font-semibold transition-colors", tab === k ? "bg-cta text-white" : "border border-line-strong text-muted hover:text-ink")}>
            {k === "open" ? labels.open : labels.resolved} <span className="tabular opacity-70">({counts[k]})</span>
          </button>
        ))}
      </div>

      {list.length ? (
        <ul className="grid gap-4 xl:grid-cols-2">
          {list.map((i) => {
            const source = calls.find((c) => c.id === i.call_id);
            return (
              <li key={i.id} className="dash-panel flex flex-col gap-4 rounded-panel border border-line bg-surface/80 p-5 shadow-float backdrop-blur-xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-snug font-semibold">{i.title}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <PriorityDot priority={i.priority} />
                      {i.category && <span>{i.category}</span>}
                      <span>{f.ago(i.created_at)}</span>
                    </p>
                  </div>
                  {i.status === "resolved" && <CircleCheckBig className="size-5 shrink-0 text-success" aria-label={labels.resolved} />}
                </div>
                {i.detail && <p className="text-sm leading-relaxed text-muted">{i.detail}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  {i.contact_phone && (
                    <a href={`tel:${i.contact_phone.replace(/\s/g, "")}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold hover:border-ink/30">
                      <Phone className="size-3.5" aria-hidden="true" />
                      {i.contact_name ? `${i.contact_name} · ` : ""}
                      {maskPhone(i.contact_phone)}
                    </a>
                  )}
                  {source && (
                    <button type="button" onClick={() => setCall(source)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted hover:text-ink">
                      {t("source")}
                    </button>
                  )}
                  <span className="flex-1" />
                  {i.status === "open" ? (
                    <button type="button" onClick={() => setIssueStatus(i.id, "resolved")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-cta px-4 text-xs font-semibold text-white">
                      <Check className="size-3.5" aria-hidden="true" />
                      {t("markResolved", { resolved: labels.resolved })}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIssueStatus(i.id, "open")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold text-muted hover:text-ink">
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      {t("reopen")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty icon={<CircleCheckBig className="size-5" aria-hidden="true" />} title={tab === "open" ? t("noneOpen") : t("noneResolved")} />
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Sparkles className="size-3.5" aria-hidden="true" />
        {t("ai")}
      </p>
      <CallDrawer call={call} onClose={() => setCall(null)} />
    </div>
  );
}
