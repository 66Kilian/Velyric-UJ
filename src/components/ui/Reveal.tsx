"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";

// Kép-felfedés: maszk (clip-path) nyílik alulról, egyszer, amikor a kép a képernyőre ér.
// Csak képekre és illusztrációkra – szövegblokkok a helyükön jelennek meg.
export function MediaReveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ clipPath: "inset(12% 0% 0% 0% round 28px)", opacity: 0.001 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 28px)", opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
    >
      {children}
    </m.div>
  );
}
