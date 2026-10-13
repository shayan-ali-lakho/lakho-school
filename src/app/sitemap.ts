import type { MetadataRoute } from "next";

const base = process.env.AUTH_URL ?? "https://lakhoschool.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/academics", "/admissions", "/news", "/contact"].map((path) => ({
    url: `${base}${path}`,
  }));
}
