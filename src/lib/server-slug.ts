import { and, eq, ne } from "drizzle-orm";
import { type AppDb } from "@/db/client";
import { servers } from "@/db/schema";
import { buildServerSlugFromName } from "@/lib/seo";

export function isLegacyServerSlug(slug: string, serverId: number) {
  return !slug || slug === String(serverId) || slug === `server-${serverId}`;
}

export function resolveServerSlug(server: { id: number; name: string; slug: string }) {
  if (isLegacyServerSlug(server.slug, server.id)) {
    return buildServerSlugFromName(server.name);
  }
  return server.slug;
}

export async function ensureUniqueServerSlug(params: {
  db: AppDb;
  name: string;
  excludeServerId?: number;
}) {
  const { db, name, excludeServerId } = params;
  const baseSlug = buildServerSlugFromName(name) || "server-mu";

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const whereClause = excludeServerId
      ? and(eq(servers.slug, slug), ne(servers.id, excludeServerId))
      : eq(servers.slug, slug);

    const existing = await db.select({ id: servers.id }).from(servers).where(whereClause).limit(1);

    if (!existing[0]) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function rebuildAllServerSlugs(db: AppDb) {
  const allServers = await db
    .select({ id: servers.id, name: servers.name, slug: servers.slug })
    .from(servers);

  let updatedCount = 0;

  for (const server of allServers) {
    const normalizedCurrentSlug = buildServerSlugFromName(server.slug);
    const nextSlug = await ensureUniqueServerSlug({
      db,
      name: server.name,
      excludeServerId: server.id,
    });

    if (normalizedCurrentSlug === nextSlug) {
      continue;
    }

    await db.update(servers).set({ slug: nextSlug }).where(eq(servers.id, server.id));
    updatedCount += 1;
  }

  return {
    total: allServers.length,
    updated: updatedCount,
  };
}
