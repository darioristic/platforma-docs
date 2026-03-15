import type { MetadataRoute } from "next";
import { getAllDocSlugs } from "@/lib/mdx";

const siteUrl = "https://docs.platforma.cloud";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllDocSlugs();

  const docPages = slugs.map((slug) => ({
    url: `${siteUrl}/${slug.join("/")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docPages,
  ];
}
