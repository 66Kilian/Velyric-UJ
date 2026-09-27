"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Call, WidgetKey } from "@/lib/dashboard/schema";
import { useDashboard } from "../DashboardProvider";
import { CallDrawer, PageHeader, SampleBanner, useFormat } from "../kit";
import { AssistantWidget, BookingsWidget, CallsWidget, IssuesWidget, LiveWidget, StatsWidget, TopicsWidget, VolumeWidget, WIDGET_SPAN } from "../widgets";

// ÁTTEKINTÉS – a felhasználó által összeállított főoldal
export function HomeView() {
  const t = useTranslations("dash.home");
  const { workspace, calls, onboarding } = useDashboard();
  const f = useFormat();
  const [open, setOpen] = useState<Call | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 10 ? t("morning") : hour < 18 ? t("day") : t("evening");
  const today = calls.filter((c) => new Date(c.started_at).toDateString() === new Date().toDateString()).length;

  const render = (w: WidgetKey) => {
    switch (w) {
      case "live":
        return <LiveWidget onOpen={setOpen} />;
      case "stats":
        return <StatsWidget />;
      case "issues":
        return <IssuesWidget />;
      case "bookings":
        return <BookingsWidget />;
      case "calls":
        return <CallsWidget onOpen={setOpen} />;
      case "volume":
        return <VolumeWidget />;
      case "topics":
        return <TopicsWidget />;
      case "assistant":
        return <AssistantWidget />;
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        title={greeting}
        text={t("summary", { agent: onboarding.voice.agentName, count: today, date: f.day(new Date().toISOString()) })}
      />
      <SampleBanner />
      <div className="grid grid-flow-row-dense grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12">
        {workspace.prefs.widgets
          .filter((w) => !(w === "bookings" && workspace.prefs.kind === "cases"))
          .map((w, i) => (
            <div key={w} className={cn("rise-in min-w-0", WIDGET_SPAN[w], "[&>section]:h-full")} style={{ animationDelay: `${i * 60}ms` }}>
              {render(w)}
            </div>
          ))}
      </div>
      <CallDrawer call={open} onClose={() => setOpen(null)} />
    </div>
  );
}
