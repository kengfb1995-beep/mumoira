import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { posts, servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildServerPath, siteConfig } from "@/lib/seo";
import { resolvePostSlug } from "@/lib/post-slug";
import { resolveServerSlug } from "@/lib/server-slug";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cập nhật sitemap mỗi giờ

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url.replace(/\/+$/, "");

  let allPosts: Array<{ id: number; slug: string | null; title: string; updatedAt: Date | number }> = [];
  let allServers: Array<{ id: number; slug: string | null; name: string; updatedAt: Date | number }> = [];

  try {
    const db = getDb();
    if (db) {
      const [postRows, serverRows] = await Promise.all([
        db
          .select({ id: posts.id, slug: posts.slug, title: posts.title, updatedAt: posts.updatedAt })
          .from(posts)
          .where(eq(posts.status, "published"))
          .orderBy(desc(posts.id))
          .limit(2000),
        db
          .select({ id: servers.id, slug: servers.slug, name: servers.name, updatedAt: servers.updatedAt })
          .from(servers)
          .where(eq(servers.status, "active"))
          .orderBy(desc(servers.id))
          .limit(2000),
      ]);
      allPosts = postRows ?? [];
      allServers = serverRows ?? [];
    }
  } catch (error) {
    console.error("[Sitemap] Error fetching data for sitemap:", error);
    allPosts = [];
    allServers = [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tin-tuc`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = allPosts.map((item) => {
    const postSlug = resolvePostSlug({
      id: item.id,
      title: item.title,
      slug: item.slug ?? "",
    });
    const lastMod = item.updatedAt ? new Date(item.updatedAt) : new Date();

    return {
      url: `${baseUrl}/tin-tuc/${item.id}-${postSlug}`,
      lastModified: isNaN(lastMod.getTime()) ? new Date() : lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  const serverRoutes: MetadataRoute.Sitemap = allServers.map((item) => {
    const serverSlug = resolveServerSlug({
      id: item.id,
      name: item.name,
      slug: item.slug ?? "",
    });
    const lastMod = item.updatedAt ? new Date(item.updatedAt) : new Date();

    return {
      url: `${baseUrl}${buildServerPath(item.id, serverSlug)}`,
      lastModified: isNaN(lastMod.getTime()) ? new Date() : lastMod,
      changeFrequency: "daily",
      priority: 0.85,
    };
  });

  return [...staticRoutes, ...postRoutes, ...serverRoutes];
}
