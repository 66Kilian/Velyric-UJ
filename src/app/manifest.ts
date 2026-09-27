import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Velyric – MI hangügynökök",
    short_name: "Velyric",
    start_url: "/",
    display: "browser",
    background_color: "#fff7fb",
    theme_color: "#fff7fb",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
