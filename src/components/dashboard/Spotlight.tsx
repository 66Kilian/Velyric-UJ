"use client";

import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

// REFLEKTOR – elhomályosítja és elsötétíti a hátteret, lágy „felhőket” úsztat benne,
// egy elemet (ha van) kivág és gyűrűvel kiemel, mellé nyíllal mutató buborékot tesz.
// A túra és a súgó is ezt használja. Esc bezárja, a fókusz a buborékban marad.

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 10;

export function Spotlight({
  target,
  onClose,
  children,
  label,
  closeLabel,
  width = 380,
}: {
  /** data-tour azonosító; ha nincs, a buborék középen jelenik meg */
  target?: string | null;
  onClose: () => void;
  children: ReactNode;
  label: string;
  closeLabel: string;
  width?: number;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState({ w: width, h: 220 });

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // A célelem helye (görgetésre, átméretezésre frissül); először a képernyőre görgetjük
  useEffect(() => {
    if (!target) {
      const id = requestAnimationFrame(() => setRect(null));
      return () => cancelAnimationFrame(id);
    }
    // Az első LÁTHATÓ elem (mobilon az alsó sáv, asztalon az oldalsáv példánya)
    const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)).find((x) => x.getClientRects().length > 0);
    if (!el) {
      const id = requestAnimationFrame(() => setRect(null));
      return () => cancelAnimationFrame(id);
    }
    el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      });
    };
    measure();
    const t = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [target]);

  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBubble({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  // Esc + fókuszcsapda
  useEffect(() => {
    if (!mounted) return;
    const prev = document.activeElement as HTMLElement | null;
    bubbleRef.current?.querySelector<HTMLElement>("button, a, input, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !bubbleRef.current) return;
      const items = bubbleRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, select");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  // Buborék elhelyezése: jobbra, balra, alá vagy fölé – ahol elfér
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bw = Math.min(bubble.w, vw - 32);
  let pos: { top: number; left: number; side: "left" | "right" | "top" | "bottom" | "center" };
  if (!rect) pos = { top: vh / 2 - bubble.h / 2, left: vw / 2 - bw / 2, side: "center" };
  else if (rect.left + rect.width + 24 + bw < vw - 16)
    pos = { top: clamp(rect.top + rect.height / 2 - bubble.h / 2, 16, vh - bubble.h - 16), left: rect.left + rect.width + 20, side: "left" };
  else if (rect.left - 24 - bw > 16)
    pos = { top: clamp(rect.top + rect.height / 2 - bubble.h / 2, 16, vh - bubble.h - 16), left: rect.left - 20 - bw, side: "right" };
  else if (rect.top + rect.height + 20 + bubble.h < vh - 16)
    pos = { top: rect.top + rect.height + 20, left: clamp(rect.left + rect.width / 2 - bw / 2, 16, vw - bw - 16), side: "top" };
  else pos = { top: Math.max(16, rect.top - 20 - bubble.h), left: clamp(rect.left + rect.width / 2 - bw / 2, 16, vw - bw - 16), side: "bottom" };

  // A nyíl a célelem közepére mutat
  const arrow =
    rect && pos.side !== "center"
      ? pos.side === "left" || pos.side === "right"
        ? { top: clamp(rect.top + rect.height / 2 - pos.top, 24, bubble.h - 24) }
        : { left: clamp(rect.left + rect.width / 2 - pos.left, 24, bw - 24) }
      : null;

  const veil = "absolute bg-[rgb(8_6_10/0.55)] backdrop-blur-md transition-all duration-500 ease-out";

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={label}>
      {/* Fátyol: a kiemelt elem körül négy elhomályosító panel */}
      {rect ? (
        <>
          <div className={veil} style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} onClick={onClose} />
          <div className={veil} style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} onClick={onClose} />
          <div className={veil} style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} onClick={onClose} />
          <div className={veil} style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} onClick={onClose} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-[calc(var(--radius-panel)+6px)] ring-2 ring-[var(--pink)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--pink)_25%,transparent),0_0_60px_10px_color-mix(in_oklab,var(--pink)_35%,transparent)] transition-all duration-500 ease-out"
            style={rect}
          />
        </>
      ) : (
        <div className={cn(veil, "inset-0")} onClick={onClose} />
      )}

      {/* Felhők */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="cloud-float absolute -top-24 left-[8%] h-80 w-[28rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--pink)_30%,transparent),transparent)] blur-3xl" />
        <div className="cloud-float-slow absolute right-[5%] bottom-[-6rem] h-96 w-[34rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--magenta)_22%,transparent),transparent)] blur-3xl" />
        <div className="cloud-float absolute top-1/3 right-1/3 h-64 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.07),transparent)] blur-2xl" />
      </div>

      {/* Buborék */}
      <div
        ref={bubbleRef}
        className="dialog-panel absolute rounded-panel border border-line-strong bg-surface p-6 text-ink shadow-lift transition-[top,left] duration-500 ease-out"
        style={{ top: pos.top, left: pos.left, width: bw }}
        data-open
      >
        {arrow && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute size-4 rotate-45 border-line-strong bg-surface",
              pos.side === "left" && "-left-2 border-b border-l",
              pos.side === "right" && "-right-2 border-t border-r",
              pos.side === "top" && "-top-2 border-t border-l",
              pos.side === "bottom" && "-bottom-2 border-r border-b",
            )}
            style={{ ...arrow, marginTop: pos.side === "left" || pos.side === "right" ? -8 : 0, marginLeft: pos.side === "top" || pos.side === "bottom" ? -8 : 0 }}
          />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    // A kezelő témáján belülre (így a buborék is a választott színeket kapja)
    document.querySelector("[data-dash]") ?? document.body,
  );
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
