"use client";

import { useEffect, useState } from "react";

// true, ha az oldal a megadott küszöbnél lejjebb van görgetve (a navbar háttérváltásához)
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}
