import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// A saját tokenjeinket (text-display/title/lead/ui, rounded-bubble/panel/media, shadow-float) is ismerje,
// hogy ne ütközzenek a színes text-* / alap rounded-* osztályokkal
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-display", "text-title", "text-lead", "text-ui"],
      rounded: ["rounded-bubble", "rounded-panel", "rounded-media"],
      shadow: ["shadow-float"],
    },
  },
});

// Osztálynevek feltételes összefűzése; ütközésnél a később megadott nyer
// (pl. <Button className="hidden sm:inline-flex"> felülírja az alap inline-flex-et)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
