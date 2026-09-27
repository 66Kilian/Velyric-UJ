"use client";

import { CalendarX2, Check, Phone, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { maskPhone, type Booking } from "@/lib/dashboard/schema";
import { useDashboard } from "../DashboardProvider";
import { Empty, PageHeader, SampleBanner, useFormat } from "../kit";
import { useKindLabels } from "../Shell";

const dayAgo = () => Date.now() - 86_400_000;

// FOGLALÁSOK / IDŐPONTOK – napokra bontva; visszaigazolás, lemondás
export function BookingsView() {
  const t = useTranslations("dash.bookings");
  const { bookings, setBookingStatus } = useDashboard();
  const labels = useKindLabels();
  const f = useFormat();

  const groups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    [...bookings]
      .filter((b) => new Date(b.starts_at).getTime() > dayAgo())
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .forEach((b) => {
        const key = new Date(b.starts_at).toDateString();
        map.set(key, [...(map.get(key) ?? []), b]);
      });
    return [...map.values()];
  }, [bookings]);

  if (!labels.bookings) return <PageHeader title={t("notUsed")} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={labels.bookings} text={t("text")} />
      <SampleBanner />
      {groups.length ? (
        groups.map((group) => (
          <section key={group[0].id} className="dash-panel rounded-panel border border-line bg-surface/80 shadow-float backdrop-blur-xl">
            <h2 className="border-b border-line px-5 py-3 font-display text-lg font-semibold capitalize sm:px-6">{f.day(group[0].starts_at)}</h2>
            <ul>
              {group.map((b) => (
                <li key={b.id} className={cn("flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 last:border-0 sm:px-6", b.status === "cancelled" && "opacity-55")}>
                  <span className="tabular w-14 font-display text-xl font-semibold">{f.time(b.starts_at)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-semibold", b.status === "cancelled" && "line-through")}>{b.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                      {b.service && <span>{b.service}</span>}
                      {b.party_size && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" aria-hidden="true" />
                          {t("party", { count: b.party_size })}
                        </span>
                      )}
                      {b.phone && (
                        <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:text-ink">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {maskPhone(b.phone)}
                        </a>
                      )}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", b.status === "confirmed" ? "bg-success/10 text-success" : b.status === "pending" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger")}>{t(`status.${b.status}`)}</span>
                  <div className="flex gap-1">
                    {b.status !== "confirmed" && (
                      <button type="button" onClick={() => setBookingStatus(b.id, "confirmed")} aria-label={t("confirm")} title={t("confirm")} className="flex size-9 items-center justify-center rounded-lg border border-line-strong hover:text-success">
                        <Check className="size-4" aria-hidden="true" />
                      </button>
                    )}
                    {b.status !== "cancelled" && (
                      <button type="button" onClick={() => setBookingStatus(b.id, "cancelled")} aria-label={t("cancel")} title={t("cancel")} className="flex size-9 items-center justify-center rounded-lg border border-line-strong hover:text-danger">
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <Empty icon={<CalendarX2 className="size-5" aria-hidden="true" />} title={t("none")} />
      )}
    </div>
  );
}
