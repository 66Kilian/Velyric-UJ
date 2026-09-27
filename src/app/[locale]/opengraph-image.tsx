import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

// Megtervezett megosztási kép (1200×630) nyelvenként: a főcím, a V jel és a „hang”
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Velyric";

const bars = [0.35, 0.6, 0.9, 0.55, 1, 0.7, 0.45, 0.85, 0.6, 0.3, 0.75, 0.5, 0.95, 0.4, 0.65, 0.3];

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "hero" });

  const [bold, medium, mark] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Montserrat-Bold.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Montserrat-Medium.ttf")),
    readFile(join(process.cwd(), "public/brand/velyric-mark.png")),
  ]);
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

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
          background: "#050409",
          backgroundImage: "radial-gradient(60% 70% at 88% 20%, rgba(139,47,232,0.28), rgba(5,4,9,0) 70%)",
          color: "#f4f1f8",
          fontFamily: "Montserrat",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={markSrc} width={62} height={44} alt="" />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 7 }}>VELYRIC</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#a49dba", letterSpacing: 3, textTransform: "uppercase" }}>
            {t("eyebrow")}
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, marginTop: 20, maxWidth: 900 }}>
            {`${t("titleLine1")} ${t("titleLine2")}`}
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
                backgroundImage: "linear-gradient(135deg, #8B2FE8, #E5237E 55%, #FF7A3C)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Montserrat", data: bold, weight: 700, style: "normal" },
        { name: "Montserrat", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
