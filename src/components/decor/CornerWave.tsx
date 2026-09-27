import { useId } from "react";
import { cn } from "@/lib/cn";

// A logó szárnyaiból ihletett hullámvonalak – finom díszítés a szekciók szélein
export function CornerWave({ className, flip = false }: { className?: string; flip?: boolean }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 400"
      fill="none"
      className={cn("pointer-events-none absolute", flip && "-scale-x-100", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B2FE8" stopOpacity="0" />
          <stop offset="0.45" stopColor="#E5237E" />
          <stop offset="1" stopColor="#FF7A3C" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${-20 + i * 14} ${400 - i * 6} C ${160 + i * 10} ${360 - i * 22}, ${250 + i * 6} ${150 - i * 14}, ${620} ${40 + i * 26}`}
          stroke={`url(#${id})`}
          strokeWidth={i === 2 ? 1.4 : 0.8}
          strokeOpacity={0.55 - Math.abs(i - 2) * 0.12}
        />
      ))}
    </svg>
  );
}
