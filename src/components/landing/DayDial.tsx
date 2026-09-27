import Image from "next/image";
import { forwardRef } from "react";
import mark from "../../../public/brand/velyric-mark.png";

type DayDialProps = {
  /** 0..1 – a nap mekkora része „telt el” (görgetés vezérli) */
  progress: number;
  /** Statikus módban (nincs 3D) a V jel képként ül a közepén */
  showMark: boolean;
  label: string;
  a11yLabel: string;
};

const R = 168; // az ív sugara (viewBox 400×400)
const CIRC = 2 * Math.PI * R;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

// 24 órás számlap: a márka-gradiens ív görgetésre 00:00-tól 24:00-ig telik.
// A középpontjába érkezik a 3D V jel (a ref a négyzetes számlapon van – ezt méri a jelenet).
export const DayDial = forwardRef<HTMLDivElement, DayDialProps>(function DayDial(
  { progress, showMark, label, a11yLabel },
  ref,
) {
  const p = Math.min(1, Math.max(0, progress));
  const hour = Math.round(p * 24);
  const angle = p * 2 * Math.PI - Math.PI / 2;

  return (
    <figure className="flex flex-col items-center">
      <div
        ref={ref}
        role="img"
        aria-label={a11yLabel}
        className="relative aspect-square w-[min(64vw,32svh)] rounded-full bg-surface shadow-lift sm:w-[min(60vw,40svh)] lg:w-[min(36vw,62svh)] [@media(max-height:720px)]:w-[27svh]"
      >
        <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <linearGradient id="dial-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F000FF" />
              <stop offset="0.45" stopColor="#FF007A" />
              <stop offset="0.75" stopColor="#FF174E" />
              <stop offset="1" stopColor="#FF7A59" />
            </linearGradient>
          </defs>

          {/* Óra-beosztás: 24 jel, a 00/06/12/18 hangsúlyos */}
          {HOURS.map((h) => {
            const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
            const major = h % 6 === 0;
            const r1 = major ? 186 : 190;
            const r2 = 197;
            const lit = h / 24 <= p;
            return (
              <line
                key={h}
                x1={200 + Math.cos(a) * r1}
                y1={200 + Math.sin(a) * r1}
                x2={200 + Math.cos(a) * r2}
                y2={200 + Math.sin(a) * r2}
                stroke={lit ? "#FF4D9D" : "rgb(255 247 251 / 0.22)"}
                strokeWidth={major ? 3 : 1.5}
                strokeLinecap="round"
              />
            );
          })}
          {[0, 6, 12, 18].map((h) => {
            const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
            return (
              <text
                key={h}
                x={200 + Math.cos(a) * 140}
                y={200 + Math.sin(a) * 140 + 5}
                textAnchor="middle"
                className="fill-muted text-[13px] font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {String(h).padStart(2, "0")}
              </text>
            );
          })}

          {/* Pálya + telő ív */}
          <circle cx="200" cy="200" r={R} fill="none" stroke="rgb(255 247 251 / 0.08)" strokeWidth="10" />
          <circle
            cx="200"
            cy="200"
            r={R}
            fill="none"
            stroke="url(#dial-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - p)}
            transform="rotate(-90 200 200)"
          />
          {/* Vándorló jelölő */}
          <circle
            cx={200 + Math.cos(angle) * R}
            cy={200 + Math.sin(angle) * R}
            r="9"
            fill="#071327"
            stroke="#FF4D9D"
            strokeWidth="4"
          />
        </svg>
        {showMark && (
          <Image
            src={mark}
            alt=""
            sizes="200px"
            className="absolute top-1/2 left-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        )}
      </div>
      <figcaption className="mt-3 flex items-baseline gap-3 text-center sm:mt-5">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="tabular text-2xl font-bold text-ink">{String(hour).padStart(2, "0")}:00</span>
      </figcaption>
    </figure>
  );
});
