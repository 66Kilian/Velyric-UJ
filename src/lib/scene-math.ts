// Képernyő-pont (px) → világ-koordináta a 3D kamera síkjában (z = 0).
// A kamera: z = 10, függőleges látószög 35° (egyezik a LogoScene beállításával).
// Külön modulban van, hogy a három.js ne kerüljön a fő csomagba.
const FOV = 35;
const DISTANCE = 10;

export function screenToWorld(px: number, py: number, vw: number, vh: number) {
  const halfH = Math.tan(((FOV / 2) * Math.PI) / 180) * DISTANCE;
  const halfW = halfH * (vw / vh);
  return {
    x: (px / vw) * 2 * halfW - halfW,
    y: halfH - (py / vh) * 2 * halfH,
    /** 1 képpont hány világ-egység */
    unit: (2 * halfW) / vw,
  };
}
