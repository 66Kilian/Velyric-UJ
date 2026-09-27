import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Élesben indexelhető; a Vercel előnézeti (preview) címek soha
export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development";
  if (isPreview) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
