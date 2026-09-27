import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// A saját tokenjeinket (text-display, rounded-card, shadow-soft/card) is ismerje,
// hogy ne ütközzenek a színes text-* / alap rounded-* osztályokkal
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-display"],
      rounded: ["rounded-card"],
      shadow: ["shadow-soft", "shadow-card"],
    },
  },
});

// Osztálynevek feltételes összefűzése; ütközésnél a később megadott nyer
// (pl. <Button className="hidden sm:inline-flex"> felülírja az alap inline-flex-et)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
