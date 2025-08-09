// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://hsscguru.vercel.app";

  // Static routes we have now
  const routes = [
    "",
    "/dashboard",
    "/practice",
    "/tests",
    "/haryana-updates",
    "/notes",
    "/jobs",
    "/login",
  ];

  const now = new Date();

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path ? "weekly" : "daily",
    priority: path === "" ? 1 : 0.7,
  }));
}
