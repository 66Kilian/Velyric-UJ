// Egy mozgás-fizika az egész oldalon (a globals.css tokenjeivel egyezik)
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // belépés
export const EASE_IN = [0.7, 0, 0.84, 0] as const; // kilépés
export const EASE_MOVE = [0.65, 0, 0.35, 1] as const; // mozgás a képernyőn

export const DURATION = {
  overlay: 0.18, // menük, legördülők
  drawer: 0.28, // mobilmenü, ablakok
  item: 0.45, // belépő elemek
} as const;
