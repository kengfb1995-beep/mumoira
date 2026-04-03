import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";
import { posts, servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { siteConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getDb();

  const [allPosts, allServers] = await Promise.all([
    db.select({ id: posts.id, updatedAt: posts.updatedAt }).from(posts).orderBy(desc(posts.id)).limit(2000),
    db.select({ id: servers.id, updatedAt: servers.updatedAt }).from(servers).orderBy(desc(servers.id)).limit(2000),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteConfig.url}/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/tin-tuc`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = allPosts.map((item) => ({
    url: `${siteConfig.url}/tin-tuc/${item.id}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const serverRoutes: MetadataRoute.Sitemap = allServers.map((item) => ({
    url: `${siteConfig.url}/server/${item.id}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticRoutes, ...postRoutes, ...serverRoutes];
}
