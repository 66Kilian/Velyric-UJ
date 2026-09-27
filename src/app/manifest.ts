import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Velyric – MI hangügynökök",
    short_name: "Velyric",
    start_url: "/",
    display: "browser",
    background_color: "#050409",
    theme_color: "#050409",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
