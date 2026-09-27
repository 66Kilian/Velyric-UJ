"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalendarCheck, Clock3, Languages, PhoneForwarded } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import type { SceneInput } from "@/components/three/LogoScene";
import { cn } from "@/lib/cn";
import mark from "../../../public/brand/velyric-mark.png";
import { CallCard } from "./CallCard";
import { DemoButton } from "./DemoButton";

// A 3D jelenet külön csomagban, csak a böngészőben töltődik be (gyors első betöltés)
const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });

const STEPS = ["s1", "s2", "s3", "s4"] as const;

type Mode = "pending" | "3d" | "static";

// Eldönti, kap-e a látogató 3D-t: csökkentett mozgásnál, adatspórolásnál vagy
// gyenge eszközön a statikus, gradiens logó marad
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

export function HeroStory() {
  const t = useTranslations("hero");
  const ts = useTranslations("story");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const input = useRef<SceneInput>({ stage: 0, px: 0, py: 0 });

  const [mode, setMode] = useState<Mode>("pending");
  const [lite, setLite] = useState(false);
  const [inView, setInView] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

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

  // GSAP ScrollTrigger: a görgetés → „stage” érték (0 = hero, 1–4 = lépések),
  // a hero szöveg parallaxa és a lépés-szövegek áttűnése
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

      // Lépés-szövegek: a képernyő közepén lévő a legélesebb
      if (!reduce) {
        stepRefs.current.forEach((el, i) => {
          if (!el) return;
          const d = Math.abs(stage - (i + 1));
          el.style.opacity = String(Math.max(0.12, 1 - d * 1.1));
        });
      }
      if (railRef.current) {
        railRef.current.style.transform = `scaleY(${Math.min(1, Math.max(0, (stage - 1) / 3))})`;
        // A sín csak a történet alatt látszik
        const rail = railRef.current.parentElement;
        if (rail) rail.style.opacity = stage > 0.6 && stage < 4.4 ? "1" : "0";
      }
      if (posterRef.current) {
        const phone = window.innerWidth < 640;
        posterRef.current.style.opacity = phone && stage < 0.35 ? "0" : "1";
      }
      const step = Math.round(stage) - 1;
      setActiveStep(stage < 0.5 ? -1 : step);
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

      // Hero szöveg: görgetéskor lágyan felúszik és elhalványul (scrub)
      if (!reduce && heroContentRef.current) {
        gsap.to(heroContentRef.current, {
          yPercent: -12,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: heroContentRef.current, start: "top top+=80", end: "bottom top+=120", scrub: true },
        });
      }
    }, wrapper);

    measure();
    update();
    return () => ctx.revert();
  }, []);

  const trust = [
    { icon: Languages, label: t("trust.languages") },
    { icon: Clock3, label: t("trust.allDay") },
    { icon: CalendarCheck, label: t("trust.calendar") },
  ];

  return (
    <div ref={wrapperRef} className="relative">
      {/* ---- Rögzített 3D réteg: a hero és a történet alatt végig látszik ---- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          {/* Statikus logó: betöltés alatt, illetve csökkentett mozgásnál ez marad.
              Telefonon a heróban rejtve (ott a szövegé a hely). */}
          <div ref={posterRef} className="transition-opacity duration-500">
            <div
              className={cn(
                "absolute top-[19svh] left-1/2 w-[58vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000",
                "lg:top-[43%] lg:left-[72%] lg:w-[30vw] lg:max-w-[500px]",
                mode === "3d" && sceneReady ? "opacity-0" : "opacity-100",
              )}
            >
              <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgb(229_35_126/0.35),transparent)]" />
              <Image src={mark} alt="" priority sizes="(min-width: 1024px) 30vw, 58vw" className="relative h-auto w-full" />
            </div>
          </div>

          {mode === "3d" && (
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                sceneReady ? "opacity-100" : "opacity-0",
              )}
            >
              <LogoScene input={input} active={inView} lite={lite} onReady={() => setSceneReady(true)} />
            </div>
          )}

          {/* Mobilon a szöveg alatti sötétítés, hogy mindig olvasható legyen */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-base-900 via-base-900/80 to-transparent lg:hidden" />
        </div>
      </div>

      {/* ---- HERO ---- */}
      <section aria-labelledby="hero-title" className="relative">
        <Container className="flex min-h-svh flex-col justify-end pt-[calc(var(--nav-h)+2rem)] pb-24 lg:justify-center lg:pb-16">
          <div ref={heroContentRef} className="relative z-10 flex max-w-xl flex-col items-start gap-6 lg:max-w-[40rem]">
            <p className="hero-in inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-base-900/40 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase backdrop-blur-sm sm:text-xs">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-pink/70" />
                <span className="relative size-2 rounded-full bg-brand-pink" />
              </span>
              {t("eyebrow")}
            </p>

            <h1 id="hero-title" className="hero-in text-display font-bold text-balance [animation-delay:80ms]">
              <span className="block">{t("titleLine1")}</span>
              <span className="text-brand block pb-1">{t("titleLine2")}</span>
            </h1>

            <p className="hero-in max-w-lg text-base leading-relaxed text-pretty text-muted [animation-delay:160ms] sm:text-lg">
              {t("subtitle")}
            </p>

            <div className="hero-in flex w-full flex-col gap-3 [animation-delay:240ms] sm:w-auto sm:flex-row">
              <Button href="/regisztracio" size="lg">
                {t("ctaPrimary")}
              </Button>
              <DemoButton />
            </div>

            <ul className="hero-in mt-2 flex flex-wrap gap-x-6 gap-y-3 [animation-delay:320ms]">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-muted">
                  <Icon className="size-4 text-brand-pink" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Élő hívás kártya – asztalon a 3D logó alatt */}
          <div className="hero-in pointer-events-none absolute right-8 bottom-10 z-10 hidden [animation-delay:500ms] xl:right-12 lg:block">
            <CallCard className="call-float" />
          </div>
        </Container>

        {/* Görgetés-jelző */}
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase sm:flex"
        >
          <span className="flex h-9 w-6 justify-center rounded-full border border-line-strong pt-2">
            <span className="scroll-dot h-2 w-1 rounded-full bg-brand" />
          </span>
          {t("scroll")}
        </div>
      </section>

      {/* ---- A TÖRTÉNET: 4 lépés, a 3D logó közben átalakul ---- */}
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

          <h2 id="story-title" className="sr-only">
            {ts("eyebrow")}
          </h2>

          {STEPS.map((key, i) => (
            <div
              key={key}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="flex min-h-svh items-end pb-16 transition-opacity duration-150 lg:items-center lg:pb-0 lg:pl-16"
            >
              <div className="relative z-10 flex max-w-lg flex-col gap-5">
                {i === 0 && <Eyebrow>{ts("eyebrow")}</Eyebrow>}
                <p className="text-sm font-semibold tracking-[0.14em] text-brand-pink uppercase">
                  {ts(`${key}.kicker`)}
                </p>
                <h3 className="text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-5xl">
                  {ts(`${key}.title`)}
                </h3>
                <p className="text-lg leading-relaxed text-pretty text-muted">{ts(`${key}.text`)}</p>
                <p
                  className={cn(
                    "inline-flex items-center gap-2.5 self-start rounded-2xl border px-4 py-3 text-sm font-medium transition-colors duration-500",
                    activeStep === i
                      ? "border-brand-pink/40 bg-brand-pink/10 text-fg"
                      : "border-line bg-base-800/60 text-muted",
                  )}
                >
                  {i === 3 ? (
                    <PhoneForwarded className="size-4 shrink-0 text-brand-orange" aria-hidden="true" />
                  ) : i === 2 ? (
                    <CalendarCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <span className="flex h-4 items-center gap-[2px]" aria-hidden="true">
                      {[0.5, 1, 0.7, 0.9, 0.4].map((h, b) => (
                        <span
                          key={b}
                          className="voice-bar w-[2px] rounded-full bg-brand"
                          style={{ height: `${h * 100}%`, animationDelay: `${b * 90}ms` }}
                        />
                      ))}
                    </span>
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
