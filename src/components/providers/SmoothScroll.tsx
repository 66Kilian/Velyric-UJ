"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/smooth-scroll";

// Sima, „vajpuha” görgetés egérrel/trackpaddel. Érintőképernyőn a natív görgetés marad,
// csökkentett mozgásnál pedig egyáltalán nem indul el. A GSAP ScrollTrigger ugyanarra
// a ticker-re fut, így a görgetés-animációk pontosan együtt mozognak a lappal.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      // Ablakok, menük és görgethető listák saját görgetése érintetlen marad
      prevent: (node) => node.closest("dialog, [data-lenis-prevent]") !== null,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
