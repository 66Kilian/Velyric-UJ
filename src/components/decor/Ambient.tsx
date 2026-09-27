// Az egész oldal alatti, rögzített „hangulat-réteg”: lágy márkaszínű fények
// és finom szemcse, hogy a háttér ne legyen halott fekete. Csak statikus
// gradiensek (nincs blur-szűrő) → görgetéskor nulla költség.
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Ambient() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(60% 50% at 85% 10%, rgb(139 47 232 / 0.16), transparent 70%)",
            "radial-gradient(50% 45% at 5% 60%, rgb(229 35 126 / 0.09), transparent 70%)",
            "radial-gradient(40% 35% at 70% 100%, rgb(255 122 60 / 0.07), transparent 70%)",
            "linear-gradient(180deg, #07060d 0%, #050409 60%, #070510 100%)",
          ].join(","),
        }}
      />
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: grain }} />
    </div>
  );
}
