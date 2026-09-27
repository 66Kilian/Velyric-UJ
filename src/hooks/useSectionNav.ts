"use client";

import type { MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { unlockScroll } from "@/lib/scroll-lock";
import { getLenis } from "@/lib/smooth-scroll";

// Szekcióra ugrás: a főoldalon helyben, finoman görget; máshonnan (pl. a
// bejelentkezésről) a Link a főoldalra visz, egyenesen a szekcióhoz.
export function useSectionNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const onHome = pathname === "/";

  const goTo = (event: MouseEvent, id: string | null) => {
    if (!onHome) return; // hagyjuk a Link-et navigálni
    event.preventDefault();
    unlockScroll();

    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
    const lenis = getLenis();
    if (lenis) {
      // Sima görgetés esetén a Lenis viszi oda (a navbar magasságát a CSS scroll-padding-top adja)
      if (id === null) lenis.scrollTo(0, { duration: 1.2 });
      else {
        const el = document.getElementById(id);
        if (el) lenis.scrollTo(el, { duration: 1.2 });
      }
      history.replaceState(null, "", id === null ? window.location.pathname : `#${id}`);
      return;
    }
    if (id === null) {
      window.scrollTo({ top: 0, behavior });
      history.replaceState(null, "", window.location.pathname);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return { onHome, goTo };
}
