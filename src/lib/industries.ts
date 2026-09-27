import type { StaticImageData } from "next/image";
import auto1 from "@/assets/images/industries/auto-1.jpg";
import auto2 from "@/assets/images/industries/auto-2.jpg";
import clinic1 from "@/assets/images/industries/clinic-1.jpg";
import clinic2 from "@/assets/images/industries/clinic-2.jpg";
import restaurant1 from "@/assets/images/industries/restaurant-1.jpg";
import restaurant2 from "@/assets/images/industries/restaurant-2.jpg";
import salon1 from "@/assets/images/industries/salon-1.jpg";
import salon2 from "@/assets/images/industries/salon-2.jpg";

// Az iparági megoldások közös adatai (a szövegek a messages/*.json „industries” alatt)
export const INDUSTRIES = [
  { key: "salon", href: "/megoldasok/szepsegszalonok", images: [salon1, salon2] },
  { key: "clinic", href: "/megoldasok/rendelok", images: [clinic1, clinic2] },
  { key: "restaurant", href: "/megoldasok/ettermek", images: [restaurant1, restaurant2] },
  { key: "auto", href: "/megoldasok/autoszervizek", images: [auto1, auto2] },
] as const satisfies readonly { key: string; href: string; images: readonly StaticImageData[] }[];

export type IndustryKey = (typeof INDUSTRIES)[number]["key"];
export type Industry = (typeof INDUSTRIES)[number];
export const getIndustry = (key: IndustryKey) => INDUSTRIES.find((i) => i.key === key)!;
