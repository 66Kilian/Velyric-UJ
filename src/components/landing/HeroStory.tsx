"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalendarCheck, CalendarClock, Languages, MoonStar, PhoneForwarded } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { SceneInput } from "@/components/three/LogoScene";
import { cn } from "@/lib/cn";
import mark from "../../../public/brand/velyric-mark.png";
import { CallPlayback, type Turn } from "./CallPlayback";
import { DemoButton } from "./DemoButton";

// A 3D jelenet külön csomagban, csak a böngészőben töltődik be (gyors első betöltés)
const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });

const STEPS = ["s1", "s2", "s3", "s4"] as const;

type Mode = "pending" | "3d" | "static";

// Eldönti, kap-e a látogató 3D-t: csökkentett mozgásnál, adatspórolásnál vagy
// gyenge eszközön a statikus logó marad
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

// A hero + „Így dolgozik a Velyric”: a 3D V jel végig jelen van (sticky réteg).
// A heróban a jel „beszél”: a példahívásban az ügynök mondatainál felerősödik a hangja.
export function HeroStory() {
  const t = useTranslations("hero");
  const ts = useTranslations("story");
  const tc = useTranslations("call");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const input = useRef<SceneInput>({ stage: 0, px: 0, py: 0, speaking: false });

  const [mode, setMode] = useState<Mode>("pending");
  const [lite, setLite] = useState(false);
  const [inView, setInView] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

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

  // 3D vagy statikus mód – csak a kliensen dönthető el
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMode(detectMode());
      setLite(window.matchMedia("(max-width: 1023px)").matches);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // A 3D csak akkor renderel, ha a szakasz látható
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

  // GSAP ScrollTrigger: a görgetés → „stage” (0 = hero, 1–4 = lépések).
  // Csak a 3D jel pózát és a haladás-sínt vezérli; a szöveg normálisan görög.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    let centers: number[] = [];
    const measure = () => {
      centers = stepRefs.current.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
      });
    };

    const update = () => {
      const y = window.scrollY;
      // Szakaszonként lineáris: 0 → 1. lépés közepe → … → 4. lépés közepe
      const points = [0, ...centers];
      let stage = 0;
      if (y >= points[points.length - 1]) stage = points.length - 1;
      else {
        for (let i = 0; i < points.length - 1; i++) {
          if (y >= points[i] && y < points[i + 1]) {
            stage = i + (y - points[i]) / Math.max(1, points[i + 1] - points[i]);
            break;
          }
        }
      }
      input.current.stage = stage;

      if (railRef.current) {
        railRef.current.style.transform = `scaleY(${Math.min(1, Math.max(0, (stage - 1) / 3))})`;
        const rail = railRef.current.parentElement;
        if (rail) rail.style.opacity = stage > 0.6 && stage < 4.4 ? "1" : "0";
      }
      // Telefonon a heróban a szövegé a hely: a statikus jel ott rejtve
      if (posterRef.current) {
        posterRef.current.style.opacity = window.innerWidth < 640 && stage < 0.35 ? "0" : "1";
      }
      setActiveStep(stage < 0.5 ? -1 : Math.round(stage) - 1);
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        onRefresh: () => {
          measure();
          update();
        },
        onUpdate: update,
      });
    }, wrapper);

    measure();
    update();
    return () => ctx.revert();
  }, []);

  const trust = [
    { icon: Languages, label: t("trust.languages") },
    { icon: MoonStar, label: t("trust.allDay") },
    { icon: CalendarClock, label: t("trust.calendar") },
  ];

  return (
    <div ref={wrapperRef} className="relative">
      {/* ---- Rögzített 3D réteg: a hero és a történet alatt végig látszik ---- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          {/* Statikus jel: betöltés alatt, illetve csökkentett mozgásnál ez marad */}
          <div ref={posterRef} className="transition-opacity duration-500">
            <div
              className={cn(
                "absolute top-[19svh] left-1/2 w-[58vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
                "lg:top-[34%] lg:left-[72%] lg:w-[27vw] lg:max-w-[460px]",
                mode === "3d" && sceneReady ? "opacity-0" : "opacity-100",
              )}
            >
              <Image src={mark} alt="" priority sizes="(min-width: 1024px) 27vw, 58vw" className="h-auto w-full" />
            </div>
          </div>

          {mode === "3d" && (
            <div
              className={cn("absolute inset-0 transition-opacity duration-700", sceneReady ? "opacity-100" : "opacity-0")}
            >
              <LogoScene input={input} active={inView} lite={lite} onReady={() => setSceneReady(true)} />
            </div>
          )}

          {/* Mobilon a szöveg alatti sötétítés, hogy mindig olvasható legyen */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-base-900 via-base-900/85 to-transparent lg:hidden" />
        </div>
      </div>

      {/* ---- HERO ---- */}
      <section aria-labelledby="hero-title" className="relative">
        <Container className="relative flex min-h-svh flex-col justify-end pt-[calc(var(--nav-h)+2.5rem)] pb-20 lg:justify-center lg:pb-24">
          <div className="relative z-10 flex max-w-xl flex-col items-start lg:max-w-[38rem]">
            <p className="rise-in text-xs font-semibold tracking-[0.16em] text-muted uppercase">{t("eyebrow")}</p>

            {/* Két sor, maszk mögül felcsúszva – az első elem a sorrendben (LCP) */}
            <h1 id="hero-title" className="mt-5 text-display font-bold text-balance">
              <span className="line-reveal">
                <span>{t("titleLine1")}</span>
              </span>
              <span className="line-reveal">
                <span className="[animation-delay:80ms]">{t("titleLine2")}</span>
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
                <li key={label} className="flex items-center gap-2 text-sm text-muted">
                  <Icon className="size-4 text-fg" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* A termék munka közben: egy lejátszódó példahívás (asztalon a 3D jel alatt) */}
          <CallPlayback
            className="rise-in relative z-10 mt-12 w-full max-w-md [animation-delay:520ms] lg:absolute lg:right-12 lg:bottom-14 lg:mt-0 lg:w-[23rem]"
            business={tc("business")}
            turns={heroTurns}
            outcome={{ kind: "booked", text: tc("booked") }}
            onSpeakingChange={onSpeaking}
          />
        </Container>

        {/* Görgetés-jelző (finoman pulzál) */}
        <div
          aria-hidden="true"
          className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 lg:flex"
        >
          <span className="flex h-9 w-6 justify-center rounded-full border border-line-strong pt-2">
            <span className="scroll-dot h-2 w-1 rounded-full bg-fg/70" />
          </span>
        </div>
      </section>

      {/* ---- A TÖRTÉNET: 4 lépés, a 3D jel közben átalakul ---- */}
      <section aria-labelledby="story-title" className="relative">
        <Container className="relative">
          {/* Haladás-sín (asztalon) */}
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-5 hidden sm:left-8 lg:left-12 lg:block">
            <div className="sticky top-1/2 flex -translate-y-1/2 flex-col items-center">
              <div className="relative h-56 w-px bg-line-strong opacity-0 transition-opacity duration-500">
                <div ref={railRef} className="absolute inset-0 origin-top scale-y-0 bg-brand" />
              </div>
            </div>
          </div>

          {STEPS.map((key, i) => (
            <div
              key={key}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="flex min-h-svh items-end pb-16 lg:items-center lg:pb-0 lg:pl-16"
            >
              <div className="relative z-10 flex max-w-lg flex-col">
                {i === 0 && (
                  <h2 id="story-title" className="mb-8 text-sm font-semibold text-muted">
                    {ts("eyebrow")}
                  </h2>
                )}
                <p className="flex items-baseline gap-3 text-sm font-semibold">
                  <span className="tabular text-muted">0{i + 1}</span>
                  <span className="text-fg">{ts(`${key}.kicker`)}</span>
                </p>
                <h3 className="mt-4 text-title font-bold text-balance">{ts(`${key}.title`)}</h3>
                <p className="mt-5 text-lead text-pretty text-muted">{ts(`${key}.text`)}</p>
                <p
                  className={cn(
                    "mt-7 inline-flex items-center gap-2.5 self-start rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-300",
                    activeStep === i ? "border-line-strong bg-base-700 text-fg" : "border-line bg-base-800 text-muted",
                  )}
                >
                  {i === 3 ? (
                    <PhoneForwarded className="size-4 shrink-0 text-warning" aria-hidden="true" />
                  ) : i === 2 ? (
                    <CalendarCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <span className="h-4 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  )}
                  {ts(`${key}.bubble`)}
                </p>
              </div>
            </div>
          ))}
        </Container>
      </section>
    </div>
  );
}
