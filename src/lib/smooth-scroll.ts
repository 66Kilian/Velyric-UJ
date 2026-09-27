import type Lenis from "lenis";

// A futó Lenis-példány (sima görgetés) – a görgetés-zár és a szekció-ugrás is ezt használja
let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};
export const getLenis = () => instance;
