// Központi webhely-adatok – egy helyen módosítható
export const site = {
  name: "Velyric",
  domain: "velyric.com",
  // Élesben a végleges domain; amíg nincs bekötve, a Vercelen NEXT_PUBLIC_SITE_URL-lel felülírható
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://velyric.com").replace(/\/$/, ""),
  phone: "+36 20 627 0766",
  phoneHref: "tel:+36206270766",
} as const;

// A navbar menüpontjai: a landing szekciók azonosítói (id) és a fordítási kulcsuk
export const navSections = [
  { id: "kik-vagyunk", labelKey: "about" },
  { id: "mit-tudunk", labelKey: "features" },
  { id: "kapcsolat", labelKey: "contact" },
] as const;

export type NavSection = (typeof navSections)[number];
