import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, gte, like, or, sql, type SQL } from "drizzle-orm";
import { CheckCircle2, Diamond, Newspaper, Search } from "lucide-react";
import { ContentPageHeader } from "@/components/layout/content-page-header";
import { posts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { resolvePostSlug } from "@/lib/post-slug";
import { buildPageMetadata, buildPostPath, stripHtml } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Tin tức MU mới nhất | Mu Mới Ra",
  description: "Cập nhật tin tức Mu Mới Ra, Mu Private, kinh nghiệm chọn server và thông tin khai mở mới nhất.",
  path: "/tin-tuc",
});

type NewsPageProps = {
  searchParams: Promise<{ page?: string; q?: string; filter?: string }>;
};

const PAGE_SIZE = 15;

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isTodayMs(ts: Date) {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function tinTucHref(opts: { page?: number; q?: string; filter?: string }) {
  const p = new URLSearchParams();
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  if (opts.q?.trim()) p.set("q", opts.q.trim());
  if (opts.filter === "today") p.set("filter", "today");
  const s = p.toString();
  return s ? `/tin-tuc?${s}` : "/tin-tuc";
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const rawPage = Number(params.page ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const q = (params.q ?? "").trim();
  const filterToday = params.filter === "today";

  const conditions: SQL[] = [];
  if (q) {
    const pattern = `%${q}%`;
    const searchCondition = or(like(posts.title, pattern), like(posts.seoKeywords, pattern));
    if (searchCondition) conditions.push(searchCondition);
  }
  if (filterToday) {
    conditions.push(gte(posts.createdAt, new Date(startOfTodayMs())));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const db = getDb();
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(whereClause);
  const totalItems = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const items = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      seoKeywords: posts.seoKeywords,
      thumbnailUrl: posts.thumbnailUrl,
      originalUrl: posts.originalUrl,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(whereClause)
    .orderBy(desc(posts.id))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE);

  const showFeatured = safePage === 1 && !q && !filterToday && items.length > 0;
  const featured = showFeatured ? items[0] : null;
  const listItems = showFeatured ? items.slice(1) : items;

  return (
    <div className="space-y-4 sm:space-y-5">
      <ContentPageHeader
        icon={Newspaper}
        title="Tin tức MU"
        description="Bố cục danh sách chuẩn portal MU: lọc theo ngày, tìm kiếm, hàng nổi bật và từng dòng tin rõ ràng."
      />

      {/* Khối danh sách kiểu portal cổ điển (nền sáng trong khung trang tối) */}
      <div className="overflow-hidden rounded-xl border border-amber-200/40 bg-[#fffef0] text-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        {/* Hàng nổi bật — chỉ trang 1, không lọc/tìm */}
        {featured ? (
          <article className="border-b-2 border-amber-200/80 bg-white px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="flex shrink-0 flex-row items-start gap-3 sm:w-[4.5rem] sm:flex-col sm:items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded border border-amber-300 bg-amber-50 text-lg font-black text-amber-900">
                  1
                </span>
                <Link
                  href={buildPostPath(featured.id, resolvePostSlug(featured))}
                  className="text-xs font-semibold text-blue-700 underline hover:text-blue-900 sm:text-center"
                >
                  [Chi tiết]
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                {featured.thumbnailUrl ? (
                  <Link
                    href={buildPostPath(featured.id, resolvePostSlug(featured))}
                    className="mb-2 block overflow-hidden rounded border border-amber-200 bg-zinc-100"
                  >
                    <img
                      src={featured.thumbnailUrl}
                      alt=""
                      className="h-auto max-h-40 w-full object-cover sm:max-h-48"
                      loading="eager"
                    />
                  </Link>
                ) : null}
                <h2 className="text-sm font-extrabold leading-snug text-zinc-900 sm:text-base">
                  <Link
                    href={buildPostPath(featured.id, resolvePostSlug(featured))}
                    className="text-blue-800 hover:underline"
                  >
                    {featured.title}
                  </Link>
                </h2>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600 sm:text-sm">{extractExcerpt(featured.content)}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 sm:w-40">
                <span className="rounded-sm bg-zinc-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300 sm:text-xs">
                  Tin nổi bật
                </span>
                <div className="text-right text-[11px] text-zinc-700 sm:text-xs">
                  <p>
                    <span className="font-semibold text-zinc-500">Đăng:</span>{" "}
                    {new Date(featured.createdAt).toLocaleString("vi-VN")}
                  </p>
                  {featured.originalUrl ? (
                    <a
                      href={featured.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-blue-700 underline"
                    >
                      Nguồn gốc
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ) : null}

        {/* Thanh lọc + tìm — nền vàng nhạt */}
        <div className="border-b border-amber-300/90 bg-[#fffacd] px-3 py-2.5 sm:px-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-800 sm:text-sm">Lọc theo:</span>
              <Link
                href={tinTucHref({ filter: "today", q })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                  filterToday
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-emerald-500 bg-white text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                Tin đăng hôm nay
              </Link>
              <Link
                href={tinTucHref({ q })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                  !filterToday
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-red-400 bg-white text-red-800 hover:bg-red-50"
                }`}
              >
                Tất cả tin
              </Link>
            </div>

            <form action="/tin-tuc" method="get" className="flex w-full min-w-0 gap-1.5 sm:max-w-md sm:flex-1 sm:justify-end">
              {filterToday ? <input type="hidden" name="filter" value="today" /> : null}
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Tìm kiếm tin MU mới ra..."
                  className="h-9 w-full rounded-md border border-amber-300/80 bg-white pl-9 pr-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tìm
              </button>
            </form>
          </div>
        </div>

        {/* Tiêu đề danh sách */}
        <div className="flex items-center gap-2 border-b border-amber-300/80 bg-[#fffacd] px-3 py-2 sm:px-4">
          <Diamond className="h-4 w-4 shrink-0 fill-red-600 text-red-600" aria-hidden />
          <h2 className="text-sm font-bold text-red-700 sm:text-base">Danh sách tin MU mới ra cập nhật</h2>
        </div>

        {/* Các dòng tin */}
        <div className="divide-y divide-amber-200/90 bg-white">
          {listItems.map((post, index) => {
            const rank = showFeatured ? index + 2 : index + 1 + (safePage - 1) * PAGE_SIZE;
            const href = buildPostPath(post.id, resolvePostSlug(post));
            const today = isTodayMs(post.createdAt);
            const kw = post.seoKeywords
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 4)
              .join(", ");

            return (
              <article key={post.id} className="group px-3 py-3 transition-colors hover:bg-amber-50/80 sm:px-4 sm:py-3.5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex w-9 shrink-0 justify-center sm:w-11">
                    <span className="flex h-9 w-9 items-center justify-center rounded border border-zinc-300 bg-zinc-50 text-base font-black text-zinc-800 sm:h-10 sm:w-10 sm:text-lg">
                      {rank}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="flex flex-wrap items-center gap-1.5 text-sm font-bold leading-snug sm:text-[15px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <Link href={href} className="text-blue-800 hover:underline">
                        {post.title}
                      </Link>
                    </h3>

                    <div className="mt-2 grid gap-1 text-[11px] text-zinc-600 sm:grid-cols-2 sm:gap-x-6 sm:text-xs">
                      <div className="space-y-0.5">
                        <p>
                          <span className="font-semibold text-zinc-500">- Đăng:</span>{" "}
                          {new Date(post.createdAt).toLocaleString("vi-VN")}
                        </p>
                        {post.originalUrl ? (
                          <p className="truncate">
                            <span className="font-semibold text-zinc-500">- Nguồn:</span>{" "}
                            <a href={post.originalUrl} className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">
                              Link gốc
                            </a>
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-0.5">
                        <p className="line-clamp-2">
                          <span className="font-semibold text-zinc-500">- Tóm tắt:</span> {extractExcerpt(post.content)}
                        </p>
                        {kw ? (
                          <p className="line-clamp-2">
                            <span className="font-semibold text-zinc-500">- Từ khóa:</span> {kw}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end sm:mt-1">
                      <span
                        className={`text-[11px] font-bold sm:text-xs ${today ? "text-red-600" : "text-zinc-500"}`}
                      >
                        {today ? "Mới đăng hôm nay" : "Đã đăng"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!items.length ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-600">
              {q || filterToday
                ? "Không có tin phù hợp. Thử bỏ bộ lọc hoặc từ khóa khác."
                : "Chuyên mục tin tức đang được cập nhật. Vui lòng quay lại sau."}
            </div>
          ) : null}
        </div>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Phân trang tin tức" className="flex flex-wrap items-center justify-center gap-1.5 pt-2 sm:gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
            const isActive = pageNumber === safePage;
            return (
              <Link
                key={pageNumber}
                href={tinTucHref({ page: pageNumber, q, filter: filterToday ? "today" : undefined })}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md border px-2.5 py-1 text-xs transition sm:px-3 sm:py-1.5 sm:text-sm ${
                  isActive
                    ? "border-amber-300 bg-amber-500/20 text-amber-100"
                    : "border-amber-500/30 bg-black/30 text-zinc-300 hover:border-amber-400 hover:text-amber-100"
                }`}
              >
                {pageNumber}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function extractExcerpt(html: string) {
  const plain = stripHtml(html);
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
}
