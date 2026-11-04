import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scholarbridge.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/admin",
        "/settings",
        "/saved",
        "/applications",
        "/onboarding",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
