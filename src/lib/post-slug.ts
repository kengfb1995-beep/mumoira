import { and, eq, ne } from "drizzle-orm";
import { type AppDb } from "@/db/client";
import { posts } from "@/db/schema";
import { buildPostSlugFromTitle } from "@/lib/seo";

const LEGACY_PREFIX = "post-";

export function isLegacyPostSlug(slug: string, postId: number) {
  return !slug || slug === `${LEGACY_PREFIX}${postId}`;
}

export function resolvePostSlug(post: { id: number; title: string; slug: string }) {
  if (isLegacyPostSlug(post.slug, post.id)) {
    return buildPostSlugFromTitle(post.title);
  }
  return post.slug;
}

export async function ensureUniquePostSlug(params: {
  db: AppDb;
  title: string;
  excludePostId?: number;
}) {
  const { db, title, excludePostId } = params;
  const baseSlug = buildPostSlugFromTitle(title) || "bai-viet";

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const whereClause = excludePostId
      ? and(eq(posts.slug, slug), ne(posts.id, excludePostId))
      : eq(posts.slug, slug);

    const existing = await db.select({ id: posts.id }).from(posts).where(whereClause).limit(1);

    if (!existing[0]) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function rebuildAllPostSlugs(db: AppDb) {
  const allPosts = await db.select({ id: posts.id, title: posts.title, slug: posts.slug }).from(posts);
  let updatedCount = 0;

  for (const post of allPosts) {
    const normalizedCurrentSlug = buildPostSlugFromTitle(post.slug);
    const nextSlug = await ensureUniquePostSlug({
      db,
      title: post.title,
      excludePostId: post.id,
    });

    if (normalizedCurrentSlug === nextSlug) {
      continue;
    }

    await db.update(posts).set({ slug: nextSlug }).where(eq(posts.id, post.id));
    updatedCount += 1;
  }

  return {
    total: allPosts.length,
    updated: updatedCount,
  };
}
