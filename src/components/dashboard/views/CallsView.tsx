"use client";

import { PhoneCall, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { maskPhone, type Call } from "@/lib/dashboard/schema";
import { useDashboard } from "../DashboardProvider";
import { CallDrawer, Empty, OutcomeChip, PageHeader, SampleBanner, useFormat } from "../kit";

const FILTERS = ["all", "resolved", "booked", "transferred", "callback", "unresolved"] as const;

// HÍVÁSOK – minden hívás, szűrhető és kereshető; kattintásra összefoglaló és átirat
export function CallsView() {
  const t = useTranslations("dash.calls");
  const to = useTranslations("dash.outcome");
  const { calls } = useDashboard();
  const f = useFormat();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Call | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls.filter(
      (c) =>
        (filter === "all" || c.outcome === filter) &&
        (!q || [c.caller_name, c.summary, c.category, c.caller_number].some((x) => x?.toLowerCase().includes(q))),
    );
  }, [calls, filter, query]);

  // Napok szerint csoportosítva
  const groups = useMemo(() => {
    const map = new Map<string, Call[]>();
    list.forEach((c) => {
      const key = new Date(c.started_at).toDateString();
      map.set(key, [...(map.get(key) ?? []), c]);
    });
    return [...map.values()];
  }, [list]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} text={t("text")} />
      <SampleBanner />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t("filter")}>
          {FILTERS.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={filter === k}
              onClick={() => setFilter(k)}
              className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors", filter === k ? "bg-cta text-white" : "border border-line-strong text-muted hover:text-ink")}
            >
              {k === "all" ? t("all") : to(k)}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="h-11 w-full rounded-xl border border-line-strong bg-surface/70 pr-3 pl-10 text-[16px] outline-none focus:border-brand-pink/70" />
        </div>
      </div>

      {groups.length ? (
        groups.map((group) => (
          <section key={group[0].id} className="dash-panel rounded-panel border border-line bg-surface/80 shadow-float backdrop-blur-xl">
            <h2 className="border-b border-line px-5 py-3 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase sm:px-6">{f.day(group[0].started_at)}</h2>
            <ul>
              {group.map((c) => (
                <li key={c.id} className="border-b border-line last:border-0">
                  <button type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-raised/40 sm:px-6">
                    <span className="tabular w-12 shrink-0 text-sm text-muted">{f.time(c.started_at)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">{c.caller_name || maskPhone(c.caller_number) || t("unknown")}</span>
                        {c.status === "active" && <span className="live-dot shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success uppercase">{t("live")}</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted">{c.summary ?? (c.category || "")}</span>
                    </span>
                    <span className="tabular hidden w-12 shrink-0 text-right text-xs text-muted sm:block">{f.duration(c.started_at, c.ended_at)}</span>
                    <span className="hidden sm:block">
                      <OutcomeChip call={c} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <Empty icon={<PhoneCall className="size-5" aria-hidden="true" />} title={t("none")} />
      )}
      <CallDrawer call={open} onClose={() => setOpen(null)} />
    </div>
  );
}
