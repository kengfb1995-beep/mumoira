import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { Newspaper } from "lucide-react";
import { posts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildPageMetadata, stripHtml } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Tin tức MU mới nhất | Mu Mới Ra",
  description: "Cập nhật tin tức Mu Mới Ra, Mu Private, kinh nghiệm chọn server và thông tin khai mở mới nhất.",
  path: "/tin-tuc",
});

export default async function NewsPage() {
  const db = getDb();
  const items = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      thumbnailUrl: posts.thumbnailUrl,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .orderBy(desc(posts.id))
    .limit(30);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-amber-300" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold text-amber-100 md:text-3xl">Tin tức MU</h1>
      </div>

      <div className="grid gap-4">
        {items.map((post) => (
          <article key={post.id} className="rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-5">
            <h2 className="text-lg font-bold text-amber-200">
              <Link href={`/tin-tuc/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-zinc-300">{extractExcerpt(post.content)}</p>
            <p className="mt-2 text-xs text-zinc-400">{new Date(post.createdAt).toLocaleString("vi-VN")}</p>
            {post.thumbnailUrl ? <p className="mt-1 truncate text-xs text-zinc-500">Ảnh gốc: {post.thumbnailUrl}</p> : null}
          </article>
        ))}

        {!items.length ? (
          <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4 text-sm text-zinc-300">
            Chưa có bài viết nào. Vào trang admin để import bài đầu tiên.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function extractExcerpt(html: string) {
  return `${stripHtml(html).slice(0, 180)}...`;
}
