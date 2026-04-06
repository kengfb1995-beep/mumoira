import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";
import { posts, servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildServerPath, siteConfig } from "@/lib/seo";
import { resolvePostSlug } from "@/lib/post-slug";
import { resolveServerSlug } from "@/lib/server-slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let allPosts: Array<{ id: number; slug: string | null; title: string; updatedAt: Date }> = [];
  let allServers: Array<{ id: number; slug: string | null; name: string; updatedAt: Date }> = [];

  try {
    const db = getDb();
    [allPosts, allServers] = await Promise.all([
      db
        .select({ id: posts.id, slug: posts.slug, title: posts.title, updatedAt: posts.updatedAt })
        .from(posts)
        .orderBy(desc(posts.id))
        .limit(2000),
      db
        .select({ id: servers.id, slug: servers.slug, name: servers.name, updatedAt: servers.updatedAt })
        .from(servers)
        .orderBy(desc(servers.id))
        .limit(2000),
    ]);
  } catch {
    allPosts = [];
    allServers = [];
  }

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
    url: `${siteConfig.url}/tin-tuc/${item.id}-${resolvePostSlug({
      id: item.id,
      title: item.title,
      slug: item.slug ?? "",
    })}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const serverRoutes: MetadataRoute.Sitemap = allServers.map((item) => ({
    url: `${siteConfig.url}${buildServerPath(item.id, resolveServerSlug({
      id: item.id,
      name: item.name,
      slug: item.slug ?? "",
    }))}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticRoutes, ...postRoutes, ...serverRoutes];
}
