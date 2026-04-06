import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { CalendarDays, Globe2, Tag } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { posts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { resolvePostSlug } from "@/lib/post-slug";
import { buildArticleJsonLd, buildPageMetadata, buildPostPath, parsePostIdFromSlug, stripHtml } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

async function getPostById(postId: number) {
  const db = getDb();
  const row = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      seoKeywords: posts.seoKeywords,
      thumbnailUrl: posts.thumbnailUrl,
      originalUrl: posts.originalUrl,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  return row[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const postId = parsePostIdFromSlug(resolved.id);
  if (!postId) {
    return buildPageMetadata({ title: "Bài viết không tồn tại", path: "/tin-tuc" });
  }
  const post = await getPostById(postId);
  if (!post) {
    return buildPageMetadata({ title: "Bài viết không tồn tại", path: "/tin-tuc" });
  }
  return buildPageMetadata({
    title: `${post.title} | Mu Mới Ra`,
    description: `${stripHtml(post.content).slice(0, 140)} | Từ khóa: ${post.seoKeywords}`,
    path: buildPostPath(post.id, resolvePostSlug(post)),
    image: post.thumbnailUrl ?? undefined,
    keywords: post.seoKeywords,
  });
}

export async function generateStaticParams() {
  try {
    const db = getDb();
    const items = await db.select({ id: posts.id, slug: posts.slug }).from(posts).limit(200);
    return items.map((item) => ({ id: `${item.id}-${resolvePostSlug(item)}` }));
  } catch {
    return [];
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const resolved = await params;
  const postId = parsePostIdFromSlug(resolved.id);
  if (!postId) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  const canonicalPath = buildPostPath(post.id, resolvePostSlug(post));
  if (resolved.id !== canonicalPath.replace("/tin-tuc/", "")) {
    redirect(canonicalPath);
  }

  const articleJsonLd = buildArticleJsonLd(post);
  const tags = post.seoKeywords
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <div className="min-w-0 p-4 sm:p-5 md:p-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
          <a href="/" className="hover:text-amber-300">Trang chủ</a>
          <span aria-hidden>/</span>
          <a href="/tin-tuc" className="hover:text-amber-300">Tin tức</a>
          <span aria-hidden>/</span>
          <span className="truncate text-zinc-300">{post.title}</span>
        </nav>

        {/* Article */}
        <article className="overflow-hidden rounded-xl border border-[#1e1010] bg-[#0a0505]">
          {/* Header bar */}
          <div className="flex items-center gap-2 border-b border-[#1e1010] bg-[#0d0505] px-4 py-2.5">
            <span className="rounded-sm bg-red-900/40 border border-red-700/30 px-2 py-0.5 text-[10px] font-bold text-red-200 sm:text-xs">
              Tin tức
            </span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">Mu Mới Ra</span>
          </div>

          {/* Content */}
          <div className="px-4 py-5 md:px-6 md:py-6">
            <header className="mb-4 space-y-3 border-b border-[#1e1010] pb-4">
              <h1 className="text-xl font-extrabold leading-snug text-zinc-100 md:text-2xl">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  Cập nhật: {new Date(post.updatedAt).toLocaleString("vi-VN")}
                </span>
                {post.originalUrl ? (
                  <a
                    href={post.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300"
                  >
                    <Globe2 className="h-3.5 w-3.5" aria-hidden />
                    Nguồn tham khảo
                  </a>
                ) : null}
              </div>

              {tags.length ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-700/30 bg-amber-900/20 px-3 py-1 text-xs font-medium text-amber-300"
                    >
                      <Tag className="h-3 w-3" aria-hidden />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            {/* Thumbnail */}
            {post.thumbnailUrl ? (
              <div className="mb-5 flex justify-center overflow-hidden rounded-lg border border-[#1e1010] bg-black/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="h-auto max-h-[min(28rem,70vh)] w-full max-w-full object-contain"
                />
              </div>
            ) : null}

            <div
              className="rich-html-body prose prose-invert w-full max-w-none text-[15px] leading-[1.7] text-zinc-200 sm:text-base prose-headings:text-zinc-100 prose-a:text-blue-400 prose-a:hover:text-blue-300 prose-p:mb-3 prose-p:text-zinc-200 prose-p:leading-relaxed prose-li:text-zinc-200 prose-ul:my-3 prose-ol:my-3"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Back link */}
        <div className="mt-4 flex justify-end">
          <a
            href="/tin-tuc"
            className="text-xs text-zinc-500 hover:text-amber-300"
          >
            ← Quay lại danh sách tin
          </a>
        </div>
      </div>
    </>
  );
}
