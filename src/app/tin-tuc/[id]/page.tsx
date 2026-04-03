import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { posts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildArticleJsonLd, buildPageMetadata, stripHtml } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

async function getPostById(postId: number) {
  const db = getDb();
  const row = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
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
  const postId = Number(resolved.id);

  if (!Number.isFinite(postId)) {
    return buildPageMetadata({
      title: "Bài viết không tồn tại | Mu Mới Ra",
      description: "Không tìm thấy bài viết tin tức Mu Mới Ra.",
      path: "/tin-tuc",
    });
  }

  const post = await getPostById(postId);
  if (!post) {
    return buildPageMetadata({
      title: "Bài viết không tồn tại | Mu Mới Ra",
      description: "Không tìm thấy bài viết tin tức Mu Mới Ra.",
      path: "/tin-tuc",
    });
  }

  return buildPageMetadata({
    title: `${post.title} | Mu Mới Ra`,
    description: stripHtml(post.content).slice(0, 160),
    path: `/tin-tuc/${post.id}`,
    image: post.thumbnailUrl,
  });
}

export async function generateStaticParams() {
  const db = getDb();
  const items = await db.select({ id: posts.id }).from(posts).limit(200);
  return items.map((item) => ({ id: String(item.id) }));
}

export default async function NewsDetailPage({ params }: Props) {
  const resolved = await params;
  const postId = Number(resolved.id);
  if (!Number.isFinite(postId)) {
    notFound();
  }

  const post = await getPostById(postId);
  if (!post) {
    notFound();
  }

  const articleJsonLd = buildArticleJsonLd(post);

  return (
    <article className="space-y-4 rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <header>
        <h1 className="text-2xl font-bold text-amber-100 md:text-3xl">{post.title}</h1>
        <p className="mt-2 text-sm text-zinc-300">Đăng lúc: {new Date(post.createdAt).toLocaleString("vi-VN")}</p>
        {post.originalUrl ? (
          <a href={post.originalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-amber-300 hover:underline">
            Nguồn tham khảo
          </a>
        ) : null}
      </header>

      <div
        className="prose prose-invert max-w-none prose-headings:text-amber-200 prose-a:text-amber-300"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
