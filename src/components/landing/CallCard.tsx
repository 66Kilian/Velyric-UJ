import { CalendarCheck, PhoneIncoming } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

// Élő hívás „képernyőkép” – 5 másodperc alatt megmutatja, mit csinál a Velyric
const bars = [0.35, 0.7, 0.5, 0.95, 0.6, 0.8, 0.4, 0.9, 0.55, 0.75, 0.45, 0.65, 0.3, 0.85];

export function CallCard({ className }: { className?: string }) {
  const t = useTranslations("call");

  return (
    <div
      className={cn(
        "w-[340px] rounded-card border border-line-strong bg-base-800/70 p-5 shadow-card backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand">
            <PhoneIncoming className="size-5 text-white" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">{t("business")}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative size-2 rounded-full bg-emerald-400" />
              </span>
              {t("live")} · 00:42
            </p>
          </div>
        </div>
        {/* Mini hanghullám – csak transform animáció (GPU) */}
        <div role="img" aria-label={t("waveLabel")} className="flex h-8 items-center gap-[3px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className="voice-bar w-[3px] rounded-full bg-brand"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 text-[13px] leading-snug">
        <p className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-base-700 px-3.5 py-2.5 text-fg/90">
          {t("caller")}
        </p>
        <p className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-brand-pink/30 bg-brand-pink/10 px-3.5 py-2.5">
          {t("agent")}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-[13px] font-medium text-emerald-300">
        <CalendarCheck className="size-4 shrink-0" aria-hidden="true" />
        {t("booked")}
      </div>
    </div>
  );
}
