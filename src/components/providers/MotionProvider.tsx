"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

// Framer Motion globálisan: kisebb csomag (LazyMotion + m.*), és ha a felhasználó
// csökkentett mozgást kér, a mozgó (transform) animációk kikapcsolnak
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
