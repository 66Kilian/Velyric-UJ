"use client";

import { useEffect, useState } from "react";

// Melyik szekció van éppen „olvasás alatt”: az, amelyiknek a teteje már átlépte
// a képernyő ~40%-át. Az oldal alján mindig az utolsó (a rövid Kapcsolat miatt).
export function useActiveSection(ids: readonly string[], enabled = true) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const compute = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      if (atBottom && document.getElementById(ids[ids.length - 1])) {
        current = ids[ids.length - 1];
      }
      setActive(current);
    };

    // rAF-fel: görgetésenként legfeljebb egyszer számolunk képkockánként
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    frame = requestAnimationFrame(compute);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, enabled]);

  // A főoldalon kívül (pl. bejelentkezés) nincs aktív szekció
  return enabled ? active : null;
}
