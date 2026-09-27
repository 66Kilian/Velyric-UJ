"use client";

import { ArrowUpRight, CalendarDays, CalendarX2, Check, CircleCheckBig, Clock3, Headphones, ListChecks, Pause, PhoneCall, Play, Sparkles, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Orb } from "@/components/setup/Guide";
import { VoiceBars } from "@/components/setup/ui";
import { cn } from "@/lib/cn";
import { maskPhone, type Call, type WidgetKey } from "@/lib/dashboard/schema";
import { speak, stopSpeaking } from "@/lib/onboarding/client";
import { getVoice } from "@/lib/onboarding/voices";
import { useDashboard } from "./DashboardProvider";
import { Empty, OutcomeChip, Panel, PriorityDot, useFormat, useNow } from "./kit";
import { useKindLabels } from "./Shell";

// A FŐOLDAL DOBOZAI – a felhasználó választja ki és rendezi őket (Stúdió / Beállítások)

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const weekAgo = () => Date.now() - 7 * 86_400_000;
const hourAgo = () => Date.now() - 3_600_000;

export const WIDGET_SPAN: Record<WidgetKey, string> = {
  stats: "lg:col-span-12",
  live: "lg:col-span-7",
  issues: "lg:col-span-5",
  bookings: "lg:col-span-5",
  calls: "lg:col-span-7",
  volume: "lg:col-span-7",
  topics: "lg:col-span-5",
  assistant: "lg:col-span-5",
};

function MoreLink({ path, label }: { path: string; label: string }) {
  const { href } = useDashboard();
  return (
    <NextLink href={href(path)} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-accent-ink hover:underline">
      {label}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </NextLink>
  );
}

// ---- Élő hívások ----
export function LiveWidget({ onOpen }: { onOpen: (c: Call) => void }) {
  const t = useTranslations("dash.widgets.live");
  const { calls, onboarding } = useDashboard();
  const f = useFormat();
  const live = calls.filter((c) => c.status === "active");
  useNow(live.length > 0);
  return (
    <Panel title={t("title")} tour="w-live" id="w-live" action={live.length ? <span className="live-dot flex items-center gap-1.5 text-xs font-semibold text-success"><span className="size-1.5 rounded-full bg-success" />{t("now", { count: live.length })}</span> : null}>
      {live.length ? (
        <ul className="flex flex-col gap-3">
          {live.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-4 rounded-panel border border-brand-pink/25 bg-brand-pink/[0.06] p-4 text-left transition-colors hover:bg-brand-pink/10">
                <Orb active />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold">{c.caller_name || maskPhone(c.caller_number)}</p>
                    <span className="tabular shrink-0 text-sm font-semibold">{f.duration(c.started_at, null)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {c.transcript?.length ? `„${c.transcript[c.transcript.length - 1].text}”` : t("connecting", { agent: onboarding.voice.agentName })}
                  </p>
                </div>
                <VoiceBars active />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={<Headphones className="size-5" aria-hidden="true" />} title={t("quiet", { agent: onboarding.voice.agentName })} text={t("quietText")} />
      )}
    </Panel>
  );
}

// ---- Kulcsszámok ----
export function StatsWidget() {
  const t = useTranslations("dash.widgets.stats");
  const { calls, issues, bookings } = useDashboard();
  const labels = useKindLabels();
  const f = useFormat();
  const today = calls.filter((c) => isToday(c.started_at));
  const since = weekAgo();
  const resolvedWeek = issues.filter((i) => i.status === "resolved" && i.resolved_at && new Date(i.resolved_at).getTime() > since).length;
  const handledWeek = calls.filter((c) => new Date(c.started_at).getTime() > since && (c.outcome === "resolved" || c.outcome === "booked")).length;
  const open = issues.filter((i) => i.status === "open").length;
  const done = calls.filter((c) => c.ended_at);
  const avg = done.length ? done.reduce((s, c) => s + (new Date(c.ended_at!).getTime() - new Date(c.started_at).getTime()), 0) / done.length : 0;
  const avgText = f.duration(new Date(0).toISOString(), new Date(avg).toISOString());
  const bookingsToday = bookings.filter((b) => isToday(b.starts_at) && b.status !== "cancelled").length;

  const tiles = [
    { icon: PhoneCall, label: t("callsToday"), value: today.length, sub: t("callsWeek", { count: calls.filter((c) => new Date(c.started_at).getTime() > since).length }) },
    { icon: CircleCheckBig, label: t("handled"), value: handledWeek + resolvedWeek, sub: t("handledSub") },
    { icon: ListChecks, label: t("open", { issues: labels.issues }), value: open, sub: open ? t("openSub") : t("openNone"), alert: open > 0 },
    labels.bookings
      ? { icon: CalendarDays, label: t("bookingsToday", { bookings: labels.bookings }), value: bookingsToday, sub: t("bookingsSub") }
      : { icon: Clock3, label: t("avg"), value: avgText, sub: t("avgSub") },
  ];

  return (
    <Panel tour="w-stats" className="p-0 sm:p-0">
      <h2 className="sr-only">{t("title")}</h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[inherit] bg-line lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-3 bg-surface p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted">
              <tile.icon className={cn("size-4", tile.alert ? "text-warning" : "text-accent-ink")} aria-hidden="true" />
              {tile.label}
            </dt>
            <dd className="tabular font-display text-[2.4rem] leading-none font-bold tracking-tight">{tile.value}</dd>
            <dd className="text-xs text-muted">{tile.sub}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

// ---- Fennálló problémák / teendők (az MI szedte ki a hívásokból) ----
export function IssuesWidget() {
  const t = useTranslations("dash.widgets.issues");
  const { issues, setIssueStatus } = useDashboard();
  const labels = useKindLabels();
  const f = useFormat();
  const open = issues.filter((i) => i.status === "open").sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  return (
    <Panel title={t("title", { issues: labels.issues })} id="w-issues" action={<MoreLink path="/ugyek" label={t("all")} />}>
      {open.length ? (
        <ul className="-mx-2 flex flex-col">
          {open.slice(0, 5).map((i) => (
            <li key={i.id} className="flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-raised/40">
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{i.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <PriorityDot priority={i.priority} />
                  {i.category && <span>{i.category}</span>}
                  <span>{f.ago(i.created_at)}</span>
                </p>
              </div>
              <button type="button" onClick={() => setIssueStatus(i.id, "resolved")} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold transition-colors hover:border-success/50 hover:text-success">
                <Check className="size-3.5" aria-hidden="true" />
                {labels.resolved}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={<CircleCheckBig className="size-5" aria-hidden="true" />} title={t("none")} text={t("noneText")} />
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <Sparkles className="size-3" aria-hidden="true" />
        {t("ai")}
      </p>
    </Panel>
  );
}

// ---- Foglalások / időpontok ----
export function BookingsWidget() {
  const t = useTranslations("dash.widgets.bookings");
  const { bookings } = useDashboard();
  const labels = useKindLabels();
  const f = useFormat();
  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() > hourAgo() && b.status !== "cancelled").slice(0, 5);
  if (!labels.bookings) return null;
  return (
    <Panel title={t("title", { bookings: labels.bookings })} id="w-bookings" action={<MoreLink path="/foglalasok" label={t("all")} />}>
      {upcoming.length ? (
        <ol className="relative flex flex-col gap-1 before:absolute before:top-3 before:bottom-3 before:left-[4.375rem] before:w-px before:bg-line-strong">
          {upcoming.map((b) => (
            <li key={b.id} className="relative grid grid-cols-[3.75rem_1fr] items-center gap-5 py-2">
              <span className="tabular text-right text-sm font-semibold whitespace-nowrap">{f.time(b.starts_at)}</span>
              <span className="relative flex min-w-0 items-center justify-between gap-3 rounded-xl bg-canvas/40 px-3.5 py-2.5">
                <span aria-hidden="true" className={cn("absolute top-1/2 -left-[0.95rem] size-2.5 -translate-y-1/2 rounded-full ring-4 ring-[var(--surface)]", b.status === "pending" ? "bg-warning" : "bg-[var(--pink)]")} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{b.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {[b.service, b.party_size ? t("party", { count: b.party_size }) : null, isToday(b.starts_at) ? null : f.day(b.starts_at)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {b.status === "pending" && <span className="shrink-0 text-[11px] font-semibold text-warning">{t("pending")}</span>}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty icon={<CalendarX2 className="size-5" aria-hidden="true" />} title={t("none")} />
      )}
    </Panel>
  );
}

// ---- Legutóbbi hívások ----
export function CallsWidget({ onOpen }: { onOpen: (c: Call) => void }) {
  const t = useTranslations("dash.widgets.calls");
  const { calls } = useDashboard();
  const f = useFormat();
  const recent = calls.filter((c) => c.status !== "active").slice(0, 6);
  return (
    <Panel title={t("title")} id="w-calls" action={<MoreLink path="/hivasok" label={t("all")} />}>
      {recent.length ? (
        <ul className="-mx-2 flex flex-col">
          {recent.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-4 rounded-xl px-2 py-3 text-left transition-colors hover:bg-raised/40">
                <span className="tabular w-12 shrink-0 text-xs text-muted">{f.time(c.started_at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.caller_name || maskPhone(c.caller_number)}</span>
                  <span className="block truncate text-xs text-muted">{c.summary}</span>
                </span>
                <OutcomeChip call={c} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={<PhoneCall className="size-5" aria-hidden="true" />} title={t("none")} />
      )}
    </Panel>
  );
}

// ---- Hívások az elmúlt 7 napban (egy sorozat → egy szín, jelmagyarázat nélkül; érintésre/egérre érték; táblázat képernyőolvasónak) ----
export function VolumeWidget() {
  const t = useTranslations("dash.widgets.volume");
  const locale = useLocale();
  const { calls } = useDashboard();
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => {
    const out: { label: string; full: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = d.getTime() + 86_400_000;
      out.push({
        label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d),
        full: new Intl.DateTimeFormat(locale, { weekday: "long", month: "short", day: "numeric" }).format(d),
        count: calls.filter((c) => {
          const s = new Date(c.started_at).getTime();
          return s >= d.getTime() && s < next;
        }).length,
      });
    }
    return out;
  }, [calls, locale]);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <Panel title={t("title")} id="w-volume" action={<span className="tabular text-xs text-muted">{t("total", { count: total })}</span>}>
      <div className="relative" aria-hidden="true">
        <div className="flex h-44 items-end gap-2 border-b border-line-strong sm:gap-3">
          {days.map((d, i) => (
            <div key={d.full} className="group relative flex h-full flex-1 items-end" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <div
                className={cn("mx-auto w-full max-w-9 rounded-t-[4px] transition-[height,opacity] duration-700 ease-out", hover === null || hover === i ? "opacity-100" : "opacity-45")}
                style={{ height: `${Math.max(2, (d.count / max) * 100)}%`, background: "var(--pink)" }}
              />
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-float">
                  <p className="text-muted">{d.full}</p>
                  <p className="tabular font-semibold text-ink">{t("calls", { count: d.count })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2 sm:gap-3">
          {days.map((d, i) => (
            <span key={d.full} className={cn("flex-1 text-center text-[11px] capitalize", i === 6 ? "font-semibold text-ink" : "text-muted")}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{t("title")}</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.full}>
              <th scope="row">{d.full}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

// ---- Miről telefonálnak? (az MI kategóriái) ----
export function TopicsWidget() {
  const t = useTranslations("dash.widgets.topics");
  const { calls } = useDashboard();
  const since = weekAgo();
  const counts = new Map<string, number>();
  calls.forEach((c) => {
    if (c.category && new Date(c.started_at).getTime() > since) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  });
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Panel title={t("title")} id="w-topics">
      {rows.length ? (
        <ul className="flex flex-col gap-4">
          {rows.map(([name, count]) => (
            <li key={name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{name}</span>
                <span className="tabular text-muted">{count}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: "var(--pink)" }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={<Users className="size-5" aria-hidden="true" />} title={t("none")} />
      )}
    </Panel>
  );
}

// ---- Az asszisztens névjegye ----
export function AssistantWidget() {
  const t = useTranslations("dash.widgets.assistant");
  const locale = useLocale() as "hu" | "en" | "de";
  const { onboarding } = useDashboard();
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  const v = onboarding.voice;
  const tasks = onboarding.tasks.filter((x) => x.enabled);
  return (
    <Panel title={t("title")} id="w-assistant" action={<MoreLink path="/asszisztens" label={t("edit")} />}>
      <div className="flex items-center gap-4">
        <Orb active={playing} size="lg" />
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold">{v.agentName}</p>
          <p className="text-sm text-muted">{getVoice(v.id).name} · {t("tasks", { count: tasks.length })}</p>
        </div>
      </div>
      <blockquote className="mt-4 rounded-bubble rounded-tl-md border border-brand-pink/25 bg-brand-pink/[0.06] px-4 py-3 text-sm leading-relaxed">„{v.greeting}”</blockquote>
      <button
        type="button"
        onClick={async () => {
          if (playing) {
            stopSpeaking();
            setPlaying(false);
            return;
          }
          setPlaying(true);
          await speak(v.greeting, v.id, locale, () => setPlaying(false));
        }}
        className="mt-3 inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-line-strong px-4 text-xs font-semibold hover:border-ink/30"
      >
        {playing ? <Pause className="size-3.5 fill-current" aria-hidden="true" /> : <Play className="size-3.5 fill-current" aria-hidden="true" />}
        {playing ? <VoiceBars active /> : t("listen")}
      </button>
    </Panel>
  );
}
