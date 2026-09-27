"use client";

import { CalendarCheck, PhoneForwarded, PhoneIncoming, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Turn = { who: "caller" | "agent"; text: string };
export type Outcome = { kind: "booked" | "handoff"; text: string };

type CallPlaybackProps = {
  business: string;
  turns: Turn[];
  outcome: Outcome;
  /** Jelzés a 3D jelnek: most az ügynök beszél */
  onSpeakingChange?: (speaking: boolean) => void;
  className?: string;
};

// Olvasási idő egy mondathoz (ms) – hogy a lejátszás emberi tempójú legyen
const readTime = (text: string) => Math.min(2600, 700 + text.length * 28);

// Egy példahívás lejátszása: a sorok emberi tempóban érkeznek, az ügynök
// „beszéd” közben hanghullámot mutat. Egyszer játszódik le (nincs végtelen
// ismétlés), utána „Újrajátszás”. Csökkentett mozgásnál azonnal a teljes átirat.
export function CallPlayback({ business, turns, outcome, onSpeakingChange, className }: CallPlaybackProps) {
  const t = useTranslations("call");
  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0); // hány sor látszik
  const [speaking, setSpeaking] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0); // újrajátszás számláló
  const timers = useRef<number[]>([]);

  const setSpeakingBoth = useCallback(
    (value: boolean) => {
      setSpeaking(value);
      onSpeakingChange?.(value);
    },
    [onSpeakingChange],
  );

  // Lejátszás, amikor a panel láthatóvá válik
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const clear = () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const play = () => {
      clear();
      if (reduce) {
        // Csökkentett mozgás: azonnal a teljes átirat, a valós hívásidővel
        const total = turns.reduce((sum, turn) => sum + readTime(turn.text) + 350, 500);
        setShown(turns.length);
        setElapsed(Math.round(total / 1000));
        setDone(true);
        return;
      }
      setShown(0);
      setDone(false);
      let at = 500;
      turns.forEach((turn, i) => {
        timers.current.push(window.setTimeout(() => {
          setShown(i + 1);
          if (turn.who === "agent") setSpeakingBoth(true);
        }, at));
        at += readTime(turn.text);
        if (turn.who === "agent") timers.current.push(window.setTimeout(() => setSpeakingBoth(false), at - 250));
        at += 350;
      });
      timers.current.push(window.setTimeout(() => setDone(true), at));
    };

    let started = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          play();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clear();
      onSpeakingChange?.(false);
    };
  }, [turns, run, setSpeakingBoth, onSpeakingChange]);

  // Hívásidő-számláló, amíg tart a beszélgetés
  useEffect(() => {
    if (done || shown === 0) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [done, shown]);

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const OutcomeIcon = outcome.kind === "booked" ? CalendarCheck : PhoneForwarded;

  return (
    <div
      ref={rootRef}
      className={cn("rounded-panel border border-line-strong bg-surface p-5 shadow-float sm:p-6", className)}
    >
      {/* Fejléc: ki hív, mióta, és hogy ez példa */}
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-raised">
            <PhoneIncoming className="size-5 text-ink" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{business}</p>
            <p className="text-xs whitespace-nowrap text-muted">
              {done ? t("ended") : t("incoming")} <span className="tabular">{mmss}</span>
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-line-strong px-2 py-1 text-[11px] font-medium text-muted">
          {t("exampleShort")}
        </span>
      </div>

      {/* Átirat – képernyőolvasónak a teljes szöveg egyben is elérhető */}
      <ol className="mt-4 flex min-h-[13.5rem] flex-col gap-2.5 text-sm leading-snug" aria-label={t("transcript")}>
        {turns.slice(0, shown).map((turn, i) => (
          <li
            key={`${run}-${i}`}
            className={cn(
              "turn-in max-w-[88%] rounded-xl px-3.5 py-2.5",
              turn.who === "caller"
                ? "self-start rounded-bl-md bg-raised text-ink"
                : "self-end rounded-br-md border border-brand-pink/35 bg-brand-pink/10 text-ink",
            )}
          >
            <span className="sr-only">{turn.who === "caller" ? t("caller") : t("agent")}: </span>
            {turn.text}
          </li>
        ))}
        {speaking && (
          <li className="flex items-center gap-2 self-end pr-1 text-xs text-muted" aria-hidden="true">
            <span className="flex h-3.5 items-center gap-[2px]">
              {[0.5, 1, 0.7, 0.9, 0.4].map((h, b) => (
                <span
                  key={b}
                  className="voice-bar w-[2px] rounded-full bg-brand"
                  style={{ height: `${h * 100}%`, animationDelay: `${b * 90}ms` }}
                />
              ))}
            </span>
            Velyric
          </li>
        )}
      </ol>

      {/* Kimenetel + újrajátszás */}
      <div className="mt-4 flex min-h-11 items-center justify-between gap-3">
        {done ? (
          <p
            className={cn(
              "turn-in flex items-center gap-2 text-sm font-medium",
              outcome.kind === "booked" ? "text-success" : "text-warning",
            )}
            role="status"
          >
            <OutcomeIcon className="size-4 shrink-0" aria-hidden="true" />
            {outcome.text}
          </p>
        ) : (
          <span />
        )}
        {done && (
          <button
            type="button"
            onClick={() => {
              setElapsed(0);
              setRun((r) => r + 1);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("replay")}
          </button>
        )}
      </div>
    </div>
  );
}
