import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl: a nyelvi beállítások (üzenetek betöltése) innen jönnek
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF az elsődleges, WebP a tartalék – kisebb képek, gyorsabb betöltés
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
