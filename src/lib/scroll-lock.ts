// Háttér-görgetés tiltása (pl. nyitott mobilmenü alatt). Többszöri hívásra is biztonságos.
let locked = false;

export function lockScroll() {
  if (locked) return;
  locked = true;
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  if (!locked) return;
  locked = false;
  document.documentElement.style.overflow = "";
}
