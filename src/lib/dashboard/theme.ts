import type { CSSProperties } from "react";
import type { Prefs } from "./schema";

// A kezelő témája: a felhasználó által választott stílus, mód és szín CSS-változókká alakítva.
// Ugyanazokat a tokeneket írjuk felül, amelyeket az oldal összes komponense használ
// (--canvas, --surface, --ink, --pink…), így minden elem automatikusan igazodik.

type Accent = {
  /** gradiens: világos → fő → mély → lezáró */
  stops: [string, string, string, string];
  /** hangsúlyos szöveg sötét / világos alapon */
  inkDark: string;
  inkLight: string;
  /** szöveg a színes gombon */
  onAccent: string;
};

export const ACCENT_PRESETS: Record<Prefs["accent"], Accent> = {
  rose: { stops: ["#f000ff", "#ff007a", "#ff174e", "#ff7a59"], inkDark: "#ff5fa8", inkLight: "#c2005c", onAccent: "#ffffff" },
  champagne: { stops: ["#f6e2b3", "#d6a84f", "#b7862f", "#ecd29b"], inkDark: "#e7c27a", inkLight: "#8a6214", onAccent: "#1b1406" },
  emerald: { stops: ["#5eead4", "#10b981", "#047857", "#a7f3d0"], inkDark: "#5ee0b1", inkLight: "#047857", onAccent: "#ffffff" },
  sapphire: { stops: ["#7dd3fc", "#3b82f6", "#1d4ed8", "#a5b4fc"], inkDark: "#8ab4ff", inkLight: "#1d4ed8", onAccent: "#ffffff" },
  amethyst: { stops: ["#e879f9", "#a855f7", "#6d28d9", "#c4b5fd"], inkDark: "#c9a2ff", inkLight: "#6d28d9", onAccent: "#ffffff" },
  coral: { stops: ["#fdba74", "#ff7a59", "#e8453c", "#ffd1b8"], inkDark: "#ff9c80", inkLight: "#c2381f", onAccent: "#1f0a05" },
};

const mix = (base: string, accent: string, pct: number) => `color-mix(in oklab, ${base} ${100 - pct}%, ${accent} ${pct}%)`;

export function themeVars(prefs: Prefs): CSSProperties {
  const a = ACCENT_PRESETS[prefs.accent];
  const main = a.stops[1];
  const dark = prefs.mode === "dark";

  const surfaces = dark
    ? {
        "--deep": mix("#07060a", main, 4),
        "--canvas": mix("#0c0a10", main, 7),
        "--band": mix("#131018", main, 8),
        "--surface": mix("#18141e", main, 9),
        "--raised": mix("#221c29", main, 11),
        "--ink": "#fbf7fa",
        "--muted": "#b9afb8",
        "--line": "rgb(255 255 255 / 0.08)",
        "--line-strong": "rgb(255 255 255 / 0.15)",
        "--accent-ink": a.inkDark,
        "--success": "#6ee7b7",
        "--warning": "#fcd34d",
        "--danger": "#fda4af",
        "--on-light": "#0c0a10",
      }
    : {
        "--deep": mix("#efe9e4", main, 5),
        "--canvas": mix("#f8f5f1", main, 3),
        "--band": mix("#f2eee9", main, 4),
        "--surface": "#fffdfb",
        "--raised": mix("#f1ece7", main, 6),
        "--ink": "#1b1519",
        "--muted": "#6a5f66",
        "--line": "rgb(27 21 25 / 0.08)",
        "--line-strong": "rgb(27 21 25 / 0.15)",
        "--accent-ink": a.inkLight,
        "--success": "#047857",
        "--warning": "#b45309",
        "--danger": "#be123c",
        "--on-light": "#1b1519",
      };

  const style =
    prefs.style === "classic"
      ? { "--radius-panel": "1rem", "--radius-media": "1.25rem", "--radius-bubble": "0.75rem", "--font-display": "var(--font-serif)" }
      : prefs.style === "minimal"
        ? { "--radius-panel": "0.625rem", "--radius-media": "0.75rem", "--radius-bubble": "0.5rem", "--font-display": "var(--font-montserrat)" }
        : { "--radius-panel": "1.5rem", "--radius-media": "2rem", "--radius-bubble": "1rem", "--font-display": "var(--font-montserrat)" };

  const shadows =
    prefs.style === "minimal"
      ? { "--shadow-float": "none", "--shadow-lift": "none" }
      : dark
        ? {
            "--shadow-float": "0 1px 0 rgb(255 255 255 / 0.04) inset, 0 24px 60px -30px rgb(0 0 0 / 0.8)",
            "--shadow-lift": `0 1px 0 rgb(255 255 255 / 0.05) inset, 0 40px 90px -40px ${mix("#000000", main, 45)}`,
          }
        : {
            "--shadow-float": "0 1px 2px rgb(27 21 25 / 0.04), 0 18px 40px -24px rgb(27 21 25 / 0.18)",
            "--shadow-lift": `0 1px 2px rgb(27 21 25 / 0.05), 0 30px 70px -36px ${mix("#1b1519", main, 35)}`,
          };

  return {
    ...surfaces,
    ...style,
    ...shadows,
    "--magenta": a.stops[0],
    "--pink": a.stops[1],
    "--crimson": a.stops[2],
    "--coral": a.stops[3],
    "--plum": a.stops[2],
    "--on-accent": a.onAccent,
    "--brand-gradient": `linear-gradient(135deg, ${a.stops[0]} 0%, ${a.stops[1]} 45%, ${a.stops[2]} 80%, ${a.stops[3]} 100%)`,
    colorScheme: dark ? "dark" : "light",
  } as CSSProperties;
}
