// Központi webhely-adatok – egy helyen módosítható
export const site = {
  name: "Velyric",
  domain: "velyric.com",
  url: "https://velyric.com",
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
