import type { MetadataRoute } from "next";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scholarbridge.in";

  // Static Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date("2026-11-04"),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/scholarships`,
      lastModified: new Date("2026-11-04"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-we-verify`,
      lastModified: new Date("2026-11-04"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date("2026-11-04"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-11-04"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-11-04"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic Scholarship Detail Pages
  try {
    const { items } = await ScholarshipCatalogRepository.list({
      page: 1,
      page_size: 50,
      hide_expired: false,
    });

    const scholarshipRoutes: MetadataRoute.Sitemap = items.map((s) => ({
      url: `${baseUrl}/scholarships/${s.slug}`,
      lastModified: s.updated_at
        ? new Date(s.updated_at)
        : new Date("2026-11-04"),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...scholarshipRoutes];
  } catch {
    return staticRoutes;
  }
}
