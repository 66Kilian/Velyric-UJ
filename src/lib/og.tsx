import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Közös, megtervezett megosztási kép (1200×630): Soft Blush alap, Deep Navy cím, márka-hanghullám
export const OG_SIZE = { width: 1200, height: 630 };

const bars = [0.35, 0.6, 0.9, 0.55, 1, 0.7, 0.45, 0.85, 0.6, 0.3, 0.75, 0.5, 0.95, 0.4, 0.65, 0.3];

export async function renderOg({ eyebrow, title }: { eyebrow: string; title: string }) {
  const [bold, medium, mark] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Montserrat-Bold.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Montserrat-Medium.ttf")),
    readFile(join(process.cwd(), "public/brand/velyric-mark.png")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1e0616",
          backgroundImage: "radial-gradient(50% 65% at 88% 18%, rgba(255,0,122,0.38), rgba(30,6,22,0) 70%), radial-gradient(40% 55% at 8% 95%, rgba(240,0,255,0.22), rgba(30,6,22,0) 70%)",
          color: "#fff7fb",
          fontFamily: "Montserrat",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* A Satori (OG-renderer) csak natív <img>-et ismer – a next/image itt nem használható */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${mark.toString("base64")}`} width={62} height={44} alt="" />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 7 }}>VELYRIC</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#ff5fa8", letterSpacing: 3, textTransform: "uppercase" }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, marginTop: 20, maxWidth: 980 }}>
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 56 }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: `${h * 100}%`,
                borderRadius: 4,
                backgroundImage: "linear-gradient(135deg, #F000FF, #FF007A 45%, #FF174E 75%, #FF7A59)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Montserrat", data: bold, weight: 700, style: "normal" },
        { name: "Montserrat", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
