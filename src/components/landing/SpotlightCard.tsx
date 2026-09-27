"use client";

import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Kártya, amelyen az egér után finom márkaszínű fényfolt úszik (csak CSS-változó → olcsó)
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <div
      onPointerMove={onMove}
      className={cn(
        "group relative h-full overflow-hidden rounded-card border border-line bg-base-800/60 p-7 shadow-card transition-colors duration-300 hover:border-line-strong",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(380px circle at var(--x, 50%) var(--y, 50%), rgb(229 35 126 / 0.12), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
