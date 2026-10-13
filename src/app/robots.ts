import type { MetadataRoute } from "next";

const base = process.env.AUTH_URL ?? "https://lakhoschool.netlify.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/portal", "/api", "/login"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
