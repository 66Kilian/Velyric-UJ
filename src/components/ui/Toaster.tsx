"use client";

import { AnimatePresence, m } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribe, type Toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion";

// Értesítések (pl. „Sikeresen bejelentkeztél”) – alul középen, képernyőolvasóval is
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => subscribe(setItems), []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {items.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: DURATION.overlay, ease: EASE_OUT }}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border bg-base-800/95 px-4 py-3 text-sm font-medium shadow-float backdrop-blur-xl",
              t.kind === "success" ? "border-success/30" : "border-danger/30",
            )}
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-5 shrink-0 text-danger" aria-hidden="true" />
            )}
            {t.message}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
