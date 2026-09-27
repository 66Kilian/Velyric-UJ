"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalendarClock, Code2, Headset, Languages, MoonStar, PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { SceneInput } from "@/components/three/LogoScene";
import { cn } from "@/lib/cn";
import { screenToWorld } from "@/lib/scene-math";
import mark from "../../../public/brand/velyric-mark.png";
import { CallPlayback, type Turn } from "./CallPlayback";
import { DemoButton } from "./DemoButton";
import { DayDial } from "./DayDial";

// A 3D jelenet külön csomagban, csak a böngészőben töltődik be (gyors első betöltés)
const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });

const PILLARS = [
  { key: "team", icon: Headset },
  { key: "line", icon: PhoneCall },
  { key: "devs", icon: Code2 },
] as const;

type Mode = "pending" | "3d" | "static";

function detectMode(): Exclude<Mode, "pending"> {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const weak = (navigator.hardwareConcurrency ?? 8) <= 2;
  let webgl = false;
  try {
    webgl = !!document.createElement("canvas").getContext("webgl2");
  } catch {}
  return reduce || saveData || weak || !webgl ? "static" : "3d";
}

// HERO + KIK VAGYUNK egy összefüggő jelenetben:
// a 3D V jel a heróból a 24 órás számlap közepére repül, ott a számlap
// görgetésre 0→24 óráig telik, és egymás után kigyúl a három állítás.
export function HeroScene() {
  const t = useTranslations("hero");
  const tc = useTranslations("call");
  const tt = useTranslations("team");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0); // a számlap telése 0..1 (rAF-fel ritkítva)
  const input = useRef<SceneInput>({ stage: 0, dock: null, px: 0, py: 0, speaking: false });

  const [mode, setMode] = useState<Mode>("pending");
  const [reduce, setReduce] = useState(false);
  const [lite, setLite] = useState(false);
  const [inView, setInView] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [activePillar, setActivePillar] = useState(0);

  const heroTurns = useMemo<Turn[]>(
    () => [
      { who: "caller", text: tc("t1") },
      { who: "agent", text: tc("t2") },
      { who: "caller", text: tc("t3") },
      { who: "agent", text: tc("t4") },
    ],
    [tc],
  );
  const onSpeaking = useCallback((speaking: boolean) => {
    input.current.speaking = speaking;
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMode(detectMode());
      setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setLite(window.matchMedia("(max-width: 1023px)").matches);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // A 3D csak akkor renderel, ha a jelenet látható
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Egér-parallax (csak asztalon, finoman)
  useEffect(() => {
    if (mode !== "3d" || lite) return;
    const onMove = (e: PointerEvent) => {
      input.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      input.current.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mode, lite]);

  // Görgetés → stage (0 hero · 1 a jel a számlapon · 2 a nap vége). GSAP ScrollTrigger + Lenis.
  useEffect(() => {
    if (reduce) return;
    const team = teamRef.current;
    const pin = pinRef.current;
    const dial = dialRef.current;
    if (!team || !pin || !dial) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    let flyEnd = 1;
    let pinLen = 1;
    let frame = 0;

    // A számlap helye a rögzített állapotban → 3D világ-koordináta
    const measure = () => {
      const top = team.getBoundingClientRect().top + window.scrollY;
      flyEnd = Math.max(1, top);
      pinLen = Math.max(1, team.offsetHeight - window.innerHeight);
      const d = dial.getBoundingClientRect();
      const p = pin.getBoundingClientRect();
      const cx = d.left + d.width / 2;
      const cy = d.top - p.top + d.height / 2;
      const w = screenToWorld(cx, cy, window.innerWidth, window.innerHeight);
      input.current.dock = { x: w.x, y: w.y, width: d.width * w.unit };
    };

    const update = () => {
      const y = window.scrollY;
      const stage = y < flyEnd ? y / flyEnd : 1 + Math.min(1, (y - flyEnd) / pinLen);
      input.current.stage = stage;
      const p = Math.max(0, stage - 1);
      progressRef.current = p;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          setProgress(progressRef.current);
        });
      }
      setActivePillar(Math.min(2, Math.floor(p * 3.05)));
      // Telefonon a heróban a statikus jel rejtve (ott a szövegé a hely)
      if (posterRef.current) {
        posterRef.current.style.opacity = window.innerWidth < 640 && stage < 0.35 ? "0" : "1";
      }
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        onRefresh: () => {
          measure();
          update();
        },
        onUpdate: update,
      });
    });
    measure();
    update();
    return () => {
      cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, [reduce]);

  const dialProgress = reduce ? 1 : progress;

  const trust = [
    { icon: Languages, label: t("trust.languages") },
    { icon: MoonStar, label: t("trust.allDay") },
    { icon: CalendarClock, label: t("trust.calendar") },
  ];

  return (
    <div ref={wrapperRef} className="relative">
      {/* ---- Rögzített 3D réteg: a hero és a „Kik vagyunk” alatt végig látszik ---- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <div ref={posterRef} className="transition-opacity duration-500">
            <div
              className={cn(
                "absolute top-[19svh] left-1/2 w-[58vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
                "lg:top-[31%] lg:left-[72%] lg:w-[26vw] lg:max-w-[440px]",
                mode === "3d" && sceneReady ? "opacity-0" : "opacity-100",
                reduce && "hidden",
              )}
            >
              <Image src={mark} alt="" priority sizes="(min-width: 1024px) 26vw, 58vw" className="h-auto w-full" />
            </div>
          </div>
          {mode === "3d" && (
            <div className={cn("absolute inset-0 transition-opacity duration-700", sceneReady ? "opacity-100" : "opacity-0")}>
              <LogoScene input={input} active={inView} lite={lite} onReady={() => setSceneReady(true)} />
            </div>
          )}
        </div>
      </div>

      {/* ---- HERO ---- */}
      <section
        aria-labelledby="hero-title"
        className="relative bg-[radial-gradient(60%_60%_at_80%_25%,rgba(255,0,122,0.2)_0%,rgba(142,0,105,0.12)_40%,rgba(30,6,22,0)_75%)] bg-canvas"
      >
        <Container className="relative flex min-h-svh flex-col justify-end pt-[calc(var(--nav-h)+2.5rem)] pb-20 lg:justify-center lg:pb-24">
          <div className="relative z-20 flex max-w-xl flex-col items-start lg:max-w-[40rem]">
            <p className="rise-in text-xs font-semibold tracking-[0.16em] text-accent-ink uppercase">{t("eyebrow")}</p>
            <h1 id="hero-title" className="mt-5 text-display font-bold text-balance">
              <span className="line-reveal">
                <span>{t("titleLine1")}</span>
              </span>
              <span className="line-reveal">
                <span className="text-brand [animation-delay:90ms]">{t("titleLine2")}</span>
              </span>
            </h1>
            <p className="rise-in mt-6 max-w-lg text-lead text-pretty text-muted [animation-delay:220ms]">
              {t("subtitle")}
            </p>
            <div className="rise-in mt-9 flex w-full flex-col gap-3 [animation-delay:320ms] sm:w-auto sm:flex-row">
              <Button href="/regisztracio" size="lg">
                {t("ctaPrimary")}
              </Button>
              <DemoButton />
            </div>
            <ul className="rise-in mt-8 flex flex-wrap gap-x-7 gap-y-3 [animation-delay:400ms]">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Icon className="size-4 text-accent-ink" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <CallPlayback
            className="rise-in relative z-20 mt-12 w-full max-w-md [animation-delay:520ms] lg:absolute lg:right-12 lg:bottom-14 lg:mt-0 lg:w-[23rem]"
            business={tc("business")}
            turns={heroTurns}
            outcome={{ kind: "booked", text: tc("booked") }}
            onSpeakingChange={onSpeaking}
          />
        </Container>

        <div aria-hidden="true" className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 lg:flex">
          <span className="flex h-9 w-6 justify-center rounded-full border border-line-strong pt-2">
            <span className="scroll-dot h-2 w-1 rounded-full bg-accent-ink" />
          </span>
        </div>
      </section>

      {/* ---- KIK VAGYUNK: a nap 24 órája ---- */}
      <section
        id="kik-vagyunk"
        ref={teamRef}
        aria-labelledby="team-title"
        className="relative bg-band motion-safe:h-[300svh] motion-reduce:py-24 sm:motion-reduce:py-32"
      >
        {/* A rögzítés CSS media query-vel dől el (nem JS-ből) → nincs elrendezés-ugrás betöltéskor */}
        <div ref={pinRef} className="motion-safe:sticky motion-safe:top-0 motion-safe:flex motion-safe:h-svh motion-safe:items-start lg:motion-safe:items-center">
          <Container className="relative z-20 grid w-full items-center gap-5 pt-[calc(var(--nav-h)+0.75rem)] sm:gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pt-0">
            <div className="order-2 lg:order-1">
              <p className="text-sm font-semibold text-accent-ink [@media(max-height:720px)]:max-lg:hidden">{tt("label")}</p>
              <h2 id="team-title" className="mt-3 text-title font-bold text-balance max-sm:text-[1.75rem] [@media(max-height:720px)]:text-[1.45rem]">
                {tt("title")}
              </h2>
              <ol className="mt-5 flex flex-col gap-2 sm:mt-10">
                {PILLARS.map(({ key, icon: Icon }, i) => {
                  const active = reduce || i <= activePillar;
                  const current = !reduce && i === activePillar;
                  return (
                    <li
                      key={key}
                      className={cn(
                        "grid grid-cols-[2.75rem_1fr] gap-4 rounded-panel p-4 transition-[background-color,box-shadow] duration-500 sm:p-5 [@media(max-height:720px)]:p-3",
                        current && "bg-surface shadow-float",
                        !current && "motion-safe:max-lg:hidden",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl transition-colors duration-500",
                          active ? "bg-cta text-white" : "bg-raised text-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold">{tt(`pillars.${key}.title`)}</h3>
                        <p className="mt-1 leading-relaxed text-muted [@media(max-height:720px)]:text-sm">{tt(`pillars.${key}.text`)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <DayDial
                ref={dialRef}
                progress={dialProgress}
                showMark={mode === "static" || reduce}
                label={tt("clock")}
                a11yLabel={tt("clockA11y")}
              />
            </div>
          </Container>
        </div>
      </section>
    </div>
  );
}
