import type { Metadata } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { ExternalLink, Search } from "lucide-react";
import { CenterMidBanners } from "@/components/banners/center-mid-banners";
import { CenterTopBanner } from "@/components/banners/center-top-banner";
import { VipGoldRibbon } from "@/components/servers/vip-gold-ribbon";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildPageMetadata, buildServerPath } from "@/lib/seo";
import { resolveServerSlug } from "@/lib/server-slug";
import { BANNER_VIP_GOLD } from "@/lib/banner-config";
import {
  calendarDaysFromEventVietnam,
  formatDateTimeShortVietnam,
  isSameCalendarDayVietnam,
  VN_TIMEZONE,
} from "@/lib/vn-datetime";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string; filter?: string; q?: string }>;

// ── Pagination helpers ─────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function clampPage(page: number, totalPages: number): number {
  if (page < 1) return 1;
  if (totalPages > 0 && page > totalPages) return totalPages;
  return page;
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function buildHomeHref(page: number, opts: { filter?: string | null; q?: string | null }): string {
  const sp = new URLSearchParams();
  if (page > 1) sp.set("page", String(page));
  if (opts.filter && (opts.filter === "alpha_today" || opts.filter === "open_today")) {
    sp.set("filter", opts.filter);
  }
  const qq = opts.q?.trim();
  if (qq) sp.set("q", qq);
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}

// ── Date helpers (múi giờ VN: xem @/lib/vn-datetime) ─────────────────────────

/** Alpha đã bắt đầu (đã qua ngày alpha) và Open vẫn ở tương lai (hoặc chưa có open) */
function isOngoingAlpha(server: HomeServerRow, ref: Date): boolean {
  if (!server.alphaTestDate) return false;
  const dAlpha = calendarDaysFromEventVietnam(server.alphaTestDate, ref);
  if (dAlpha == null || dAlpha >= 0) return false;
  if (!server.openBetaDate) return true;
  const dOpen = calendarDaysFromEventVietnam(server.openBetaDate, ref);
  return dOpen != null && dOpen > 0;
}

type RegularStatus = { label: string; tone: "red" | "green" };

/** Nhãn cột phải bài thường — ưu tiên Open hôm nay, rồi Alpha hôm nay / ngày mai / đang alpha */
function getRegularListingStatus(server: HomeServerRow, ref: Date): RegularStatus | null {
  const openToday = isSameCalendarDayVietnam(server.openBetaDate, ref);
  const alphaToday = isSameCalendarDayVietnam(server.alphaTestDate, ref);
  const dOpen = calendarDaysFromEventVietnam(server.openBetaDate, ref);
  const dAlpha = calendarDaysFromEventVietnam(server.alphaTestDate, ref);

  if (openToday) return { label: "Open Beta hôm nay", tone: "red" };
  if (alphaToday) return { label: "Alpha Test hôm nay", tone: "green" };
  if (dAlpha === 1) return { label: "Alpha Test ngày mai", tone: "green" };
  if (isOngoingAlpha(server, ref)) return { label: "Đang Alpha Test", tone: "green" };
  if (dOpen === 1) return { label: "Open Beta ngày mai", tone: "green" };
  return null;
}

/** Sắp xếp server thường: ưu tiên sắp open/alpha, không áp dụng cho VIP */
function compareRegularListingPriority(a: HomeServerRow, b: HomeServerRow, ref: Date): number {
  const rank = (s: HomeServerRow): [number, number, number] => {
    const openToday = isSameCalendarDayVietnam(s.openBetaDate, ref);
    const alphaToday = isSameCalendarDayVietnam(s.alphaTestDate, ref);
    const dOpen = calendarDaysFromEventVietnam(s.openBetaDate, ref);
    const dAlpha = calendarDaysFromEventVietnam(s.alphaTestDate, ref);

    if (openToday) return [0, 0, -s.id];
    if (alphaToday && !openToday) return [1, 0, -s.id];
    if (dOpen === 1) return [2, 0, -s.id];
    if (dAlpha === 1) return [3, 0, -s.id];
    if (isOngoingAlpha(s, ref)) return [4, 0, -s.id];
    if (dOpen != null && dOpen > 1) return [100, dOpen, -s.id];
    if (dAlpha != null && dAlpha > 1) return [200, dAlpha, -s.id];
    return [10_000, 0, -s.id];
  };

  const [ta, ua, ia] = rank(a);
  const [tb, ub, ib] = rank(b);
  if (ta !== tb) return ta - tb;
  if (ua !== ub) return ua - ub;
  return ib - ia;
}

function formatDayMonth(ts: Date | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  });
}

function serverSiteLabel(server: HomeServerRow): string {
  if (!server.websiteUrl?.trim()) return server.name;
  const raw = server.websiteUrl.trim();
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.replace(/^www\./i, "") || server.name;
  } catch {
    return raw.replace(/^https?:\/\//i, "").split("/")[0] || server.name;
  }
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { page: pageStr } = await searchParams;
  const page = clampPage(Number(pageStr) || 1, 1);
  return buildPageMetadata({
    title:
      page === 1
        ? "Mu Mới Ra Hôm Nay - TOP Mu Online Private hay nhất | MuMoiRa"
        : `Danh sách server - Trang ${page} | Mu Mới Ra`,
    description:
      "Trang chủ danh bạ máy chủ MU Private mới nhất, cập nhật server VIP Vàng, VIP Bạc, server open beta và alpha test.",
    path: page === 1 ? "/" : `/?page=${page}`,
  });
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAllServers() {
  const db = getDb();
  return db
    .select({
      id: servers.id,
      name: servers.name,
      version: servers.version,
      exp: servers.exp,
      drop: servers.drop,
      openBetaDate: servers.openBetaDate,
      alphaTestDate: servers.alphaTestDate,
      websiteUrl: servers.websiteUrl,
      bannerUrl: servers.bannerUrl,
      vipPackageType: servers.vipPackageType,
      status: servers.status,
      slug: servers.slug,
    })
    .from(servers)
    .where(eq(servers.status, "active"))
    .orderBy(desc(servers.id));
}

export type HomeServerRow = Awaited<ReturnType<typeof fetchAllServers>>[number];

// ── Server row — bố cục portal mumoira.tv (STT + banner rộng + cột ngày) ─────

function ServerRow({
  server,
  index,
  variant,
  now = new Date(),
}: {
  server: HomeServerRow;
  index: number;
  variant: "vip" | "regular" | "silver";
  now?: Date;
}) {
  const slug = resolveServerSlug({ id: server.id, name: server.name, slug: server.slug ?? "" });
  const href = buildServerPath(server.id, slug);
  const openToday = isSameCalendarDayVietnam(server.openBetaDate, now);
  const alphaToday = isSameCalendarDayVietnam(server.alphaTestDate, now);
  const openLineRed = openToday;
  const listingStatus = variant === "regular" || variant === "silver" ? getRegularListingStatus(server, now) : null;

  let mainTitle = `${server.name} - Season ${server.version} - Exp: ${server.exp} - Drop: ${server.drop}`;
  if ((variant === "regular" || variant === "silver") && openToday) {
    mainTitle += ` - ${server.name} OPEN ${formatDayMonth(server.openBetaDate)}`;
  }

  const rowBg =
    variant === "vip"
      ? "border-amber-300/45 bg-[#fffff2] hover:bg-[#fffce8]"
      : variant === "silver"
        ? "border border-slate-300/90 bg-gradient-to-br from-slate-100 via-slate-50 to-white hover:border-slate-400"
        : "border border-slate-200/90 bg-[#f0f7fa] hover:bg-[#e8f2f8]";

  const isLightRow = variant === "regular" || variant === "silver";

  return (
    <article
      className={`group flex min-w-0 w-full flex-col gap-0 rounded border p-1 transition-colors sm:flex-row sm:items-start sm:gap-1.5 sm:p-1.5 ${rowBg}`}
    >
      {/* Cột 1: STT + [Chi tiết MU] — căn đỉnh hàng, không dồn giữa theo chiều dọc */}
      <div className="flex shrink-0 flex-row items-center gap-2 sm:w-[3.25rem] sm:flex-col sm:items-center sm:justify-start sm:gap-0.5 sm:pt-0.5">
        <span
          className={`text-3xl font-black leading-none tabular-nums sm:text-4xl ${
            variant === "vip" ? "text-zinc-900" : isLightRow ? "text-zinc-800" : "text-zinc-500"
          }`}
        >
          {index}
        </span>
        <a
          href={href}
          className={`text-sm font-bold underline ${
            variant === "vip" || isLightRow
              ? "text-[#2a78ad] decoration-[#2a78ad]/50 hover:text-[#1f5f8f]"
              : "text-sky-400 decoration-sky-500/60 hover:text-sky-300"
          }`}
        >
          [Chi tiết MU]
        </a>
      </div>

      {/* Cột 2: banner ngang + tiêu đề — sát nhau như mẫu portal */}
      <div className="min-w-0 min-h-0 flex-1 space-y-0.5">
        {variant === "vip" ? (
          <div className="w-full min-w-0">
            <div className="w-full min-w-0 overflow-hidden rounded border border-amber-400/60 bg-black/20">
              <a href={href} className="block w-full min-w-0">
                <div
                  className="relative w-full overflow-hidden rounded-sm border border-zinc-800/80 bg-[#0d0505]"
                  style={{ aspectRatio: `${BANNER_VIP_GOLD.w} / ${BANNER_VIP_GOLD.h}` }}
                >
                  {server.bannerUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={server.bannerUrl}
                      alt=""
                      width={BANNER_VIP_GOLD.w}
                      height={BANNER_VIP_GOLD.h}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-zinc-600">
                      <span className="px-2 text-center text-sm text-zinc-400">
                        Chưa có banner (khuyến nghị {BANNER_VIP_GOLD.w}×{BANNER_VIP_GOLD.h})
                      </span>
                    </div>
                  )}
                </div>
              </a>
            </div>
          </div>
        ) : null}

        <a
          href={href}
          className={`block min-w-0 break-words text-base font-bold leading-tight hover:underline sm:text-[17px] ${
            variant === "vip" ? "text-zinc-900" : "text-[#2a78ad]"
          }`}
        >
          {mainTitle}
        </a>

        {variant === "regular" || variant === "silver" ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-0.5 text-sm leading-tight text-zinc-800 sm:grid-cols-2 sm:text-[15px]">
            <p>
              <span className="font-medium text-zinc-700">- Server:</span> {serverSiteLabel(server)}
            </p>
            <p>
              <span className="font-medium text-zinc-700">- Alpha Test:</span>{" "}
              <span className={alphaToday ? "font-semibold text-[#1a7f45]" : "text-zinc-800"}>
                {formatDateTimeShortVietnam(server.alphaTestDate) || "—"}
              </span>
            </p>
            <p>
              <span className="font-medium text-zinc-700">- Phiên bản:</span>{" "}
              <span className="text-zinc-800">Season {server.version}</span>
            </p>
            <p>
              <span className="font-medium text-zinc-700">- Open Beta:</span>{" "}
              <span className={openLineRed ? "font-semibold text-[#c0392b]" : "text-zinc-800"}>
                {formatDateTimeShortVietnam(server.openBetaDate) || "—"}
              </span>
            </p>
          </div>
        ) : null}

        {variant === "vip" ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {server.websiteUrl ? (
              <a
                href={server.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 max-w-full items-center gap-1 text-sm font-medium text-zinc-600 hover:text-amber-700"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{server.websiteUrl}</span>
              </a>
            ) : null}
            {server.websiteUrl ? (
              <a
                href={server.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded border border-amber-700/60 bg-amber-600 px-3 py-1 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Chơi ngay
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Cột 3: VIP Vàng = ribbon + ngày; thường / bạc = nhãn realtime canh phải */}
      <div
        className={`flex w-full shrink-0 flex-col gap-0.5 border-t pt-1.5 sm:w-auto sm:min-w-[8rem] sm:max-w-[11rem] sm:border-t-0 sm:pt-0.5 ${
          variant === "vip"
            ? "items-start border-amber-300/70 sm:border-l sm:pl-2.5"
            : "items-end border-slate-200/80 sm:self-start sm:border-l sm:pl-2.5"
        }`}
      >
        {variant === "vip" ? (
          <>
            <VipGoldRibbon />
            <div className="space-y-0 text-sm leading-tight text-zinc-800">
              <p>
                <span className="font-medium text-zinc-600">Alpha:</span>{" "}
                {formatDateTimeShortVietnam(server.alphaTestDate) || "—"}
              </p>
              <p className={openToday ? "font-semibold text-red-600" : "text-zinc-800"}>
                <span className={openToday ? "font-medium text-red-600" : "font-medium text-zinc-600"}>Open:</span>{" "}
                {formatDateTimeShortVietnam(server.openBetaDate) || "—"}
              </p>
            </div>
          </>
        ) : variant === "silver" ? (
          listingStatus ? (
            <p
              className={`max-w-[12rem] text-right text-sm font-bold leading-snug sm:text-base ${
                listingStatus.tone === "red" ? "text-[#c0392b]" : "text-[#1a7f45]"
              }`}
            >
              {listingStatus.label}
            </p>
          ) : (
            <p className="text-right text-sm font-bold uppercase tracking-wide text-slate-600 sm:text-base">VIP Bạc</p>
          )
        ) : listingStatus ? (
          <p
            className={`max-w-[12rem] text-right text-sm font-bold leading-snug sm:text-base ${
              listingStatus.tone === "red" ? "text-[#c0392b]" : "text-[#1a7f45]"
            }`}
          >
            {listingStatus.label}
          </p>
        ) : (
          <p className="text-right text-sm text-zinc-500">&nbsp;</p>
        )}
      </div>
    </article>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  currentPage,
  totalPages,
  filter,
  q,
}: {
  currentPage: number;
  totalPages: number;
  filter: string | null;
  q: string;
}) {
  if (totalPages <= 1) return null;

  const range = buildPageRange(currentPage, totalPages);
  const prevHref = buildHomeHref(Math.max(1, currentPage - 1), { filter, q });
  const nextHref = buildHomeHref(Math.min(totalPages, currentPage + 1), { filter, q });

  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1 pt-1">
      {currentPage > 1 ? (
        <a
          href={prevHref}
          className="flex h-9 w-9 items-center justify-center rounded border border-[#2a1515] bg-[#0a0505] text-sm text-zinc-400 transition-all hover:border-red-700/40 hover:text-zinc-200"
        >
          ‹
        </a>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded border border-[#1e1010] bg-[#0a0505] text-sm text-zinc-700">
          ‹
        </span>
      )}

      {range.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-zinc-600">
            …
          </span>
        ) : (
          <a
            key={p}
            href={buildHomeHref(p, { filter, q })}
            className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded border px-2.5 text-sm font-semibold transition-all ${
              p === currentPage
                ? "border-red-700/60 bg-red-900/50 text-amber-200"
                : "border-[#2a1515] bg-[#0a0505] text-zinc-400 hover:border-red-700/40 hover:text-zinc-200"
            }`}
          >
            {p}
          </a>
        ),
      )}

      {currentPage < totalPages ? (
        <a
          href={nextHref}
          className="flex h-9 w-9 items-center justify-center rounded border border-[#2a1515] bg-[#0a0505] text-sm text-zinc-400 transition-all hover:border-red-700/40 hover:text-zinc-200"
        >
          ›
        </a>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded border border-[#1e1010] bg-[#0a0505] text-sm text-zinc-700">
          ›
        </span>
      )}
    </nav>
  );
}

function ListFilterBar({
  filter,
  q,
  hasServers,
}: {
  filter: string | null;
  q: string;
  hasServers: boolean;
}) {
  if (!hasServers) return null;

  const alphaActive = filter === "alpha_today";
  const openActive = filter === "open_today";

  return (
    <div className="mb-1.5 flex flex-col gap-1.5 rounded-md border border-emerald-800/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 p-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-bold text-zinc-100 sm:text-base">Lọc theo:</span>
        <a
          href={buildHomeHref(1, { filter: "alpha_today", q })}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
            alphaActive ? "bg-emerald-600 text-white ring-2 ring-emerald-400/50" : "bg-emerald-700/70 text-emerald-50 hover:bg-emerald-600"
          }`}
        >
          Alpha Test hôm nay
        </a>
        <a
          href={buildHomeHref(1, { filter: "open_today", q })}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
            openActive ? "bg-red-600 text-white ring-2 ring-red-400/50" : "bg-red-700/80 text-red-50 hover:bg-red-600"
          }`}
        >
          Open beta hôm nay
        </a>
        {(filter === "alpha_today" || filter === "open_today") && (
          <a
            href={buildHomeHref(1, { filter: null, q })}
            className="text-sm font-medium text-zinc-300 underline hover:text-zinc-100"
          >
            Xóa lọc
          </a>
        )}
      </div>

      <form method="get" action="/" className="flex w-full min-w-0 gap-1.5 sm:max-w-md sm:flex-1 sm:justify-end">
        {filter === "alpha_today" || filter === "open_today" ? <input type="hidden" name="filter" value={filter} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Tìm kiếm MU mới ra..."
          className="min-w-0 flex-1 rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 sm:px-4 sm:text-base"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center rounded-md border border-sky-600/60 bg-sky-700/80 px-3 py-2 text-sky-50 hover:bg-sky-600 sm:px-4"
          aria-label="Tìm kiếm"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const db = getDb();
  const sp = await searchParams;
  const pageStr = sp.page;
  const filterRaw = sp.filter ?? "";
  const qRaw = (sp.q ?? "").trim();
  const filter =
    filterRaw === "alpha_today" || filterRaw === "open_today" ? filterRaw : null;

  const rawPage = Number(pageStr) || 1;
  const currentPage = Math.max(1, rawPage);

  const allServers: HomeServerRow[] = await fetchAllServers();
  const vipGoldAgg = await db
    .select({ count: sql<number>`count(*)` })
    .from(servers)
    .where(and(eq(servers.status, "active"), eq(servers.vipPackageType, "vip_gold")))
    .limit(1);
  const vipGoldCount = Number(vipGoldAgg[0]?.count ?? 0);

  const now = new Date();
  const vipGoldServers = allServers.filter((s) => s.vipPackageType === "vip_gold");
  const vipSilverServers = allServers.filter((s) => s.vipPackageType === "vip_silver");
  const vipGoldIds = new Set(vipGoldServers.map((s) => s.id));
  const vipSilverIds = new Set(vipSilverServers.map((s) => s.id));
  let regularServers = allServers.filter(
    (s) => s.vipPackageType === "none" && !vipGoldIds.has(s.id) && !vipSilverIds.has(s.id),
  );

  if (filter === "alpha_today") {
    regularServers = regularServers.filter((s) => isSameCalendarDayVietnam(s.alphaTestDate, now));
  } else if (filter === "open_today") {
    regularServers = regularServers.filter((s) => isSameCalendarDayVietnam(s.openBetaDate, now));
  }

  if (qRaw) {
    const qq = qRaw.toLowerCase();
    regularServers = regularServers.filter((s) => s.name.toLowerCase().includes(qq));
  }

  regularServers = [...regularServers].sort((a, b) => compareRegularListingPriority(a, b, now));

  const totalPages = Math.max(1, Math.ceil(regularServers.length / PAGE_SIZE));
  const safePage = clampPage(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const paginatedRegular = regularServers.slice(offset, offset + PAGE_SIZE);

  const freePoolCount = allServers.filter((s) => s.vipPackageType === "none").length;
  const silverCount = vipSilverServers.length;
  const hasAnyNonGold = silverCount > 0 || freePoolCount > 0;

  return (
    <div className="min-w-0 px-1.5 py-1 sm:px-2 sm:py-1.5">
      {/* Khoảng cách dọc giữa banner ↔ tiêu đề ↔ VIP ↔ danh sách */}
      <div className="flex w-full min-w-0 flex-col gap-2 overflow-x-auto sm:gap-2.5">
        <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
          <CenterTopBanner />
          <CenterMidBanners />
        </div>

        <div className="min-w-0">
          <h1 className="text-base font-extrabold leading-tight text-amber-100 sm:text-lg">Mu Mới Ra Hôm Nay</h1>
          <p className="mt-0.5 text-xs leading-snug text-zinc-500 sm:text-sm">
            {allServers.length} server đang hoạt động
            {vipGoldCount > 0 ? ` · ${vipGoldCount} VIP Vàng` : ""}
            {silverCount > 0 ? ` · ${silverCount} VIP Bạc` : ""}
            {freePoolCount > 0 ? ` · ${freePoolCount} đăng miễn phí` : ""}
          </p>
        </div>

        {vipGoldServers.length > 0 ? (
          <section className="w-full overflow-hidden rounded-sm border border-amber-400/55 bg-[#fff8dc] shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-amber-300/90 bg-[#fff3c4] px-2 py-0.5">
              <span className="text-red-600" aria-hidden>
                ◆
              </span>
              <h2 className="text-sm font-bold text-zinc-900 sm:text-[15px]">Danh sách Mu VIP</h2>
            </div>
            <div className="space-y-1.5 p-1.5 sm:space-y-2 sm:p-2">
              {vipGoldServers.map((server, idx) => (
                <ServerRow key={server.id} server={server} index={idx + 1} variant="vip" now={now} />
              ))}
            </div>
          </section>
        ) : null}

      <section className="w-full">
        {hasAnyNonGold ? (
          <>
            <div className="mb-0 flex items-center gap-2 border-b border-sky-800/40 bg-amber-950/15 px-2 py-0.5">
              <span className="text-red-500" aria-hidden>
                ◆
              </span>
              <h2 className="text-sm font-bold leading-tight text-amber-100 sm:text-[15px]">Danh sách Mu mới ra miễn phí hôm nay</h2>
            </div>

            {vipSilverServers.length > 0 ? (
              <div className="mb-0 mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300 sm:text-sm">VIP Bạc</h3>
                {vipSilverServers.map((server, idx) => (
                  <ServerRow
                    key={server.id}
                    server={server}
                    index={vipGoldServers.length + idx + 1}
                    variant="silver"
                    now={now}
                  />
                ))}
              </div>
            ) : null}

            {freePoolCount > 0 ? (
              <>
                {vipSilverServers.length > 0 ? (
                  <h3 className="mb-0 mt-2 text-xs font-bold uppercase tracking-wide text-zinc-400 sm:mt-2.5 sm:text-sm">
                    Đăng miễn phí
                  </h3>
                ) : null}
                <ListFilterBar filter={filter} q={qRaw} hasServers={freePoolCount > 0} />

                {regularServers.length > 0 ? (
                  <>
                    <p className="mb-0.5 text-xs text-zinc-400 sm:text-sm">
                      Hiển thị {paginatedRegular.length} / {regularServers.length} server
                      {filter || qRaw ? " (đã lọc)" : ""}
                      {totalPages > 1 ? ` · Trang ${safePage}/${totalPages}` : ""}
                    </p>
                    <div className="space-y-1.5 sm:space-y-2">
                      {paginatedRegular.map((server, idx) => (
                        <ServerRow
                          key={server.id}
                          server={server}
                          index={vipGoldServers.length + vipSilverServers.length + offset + idx + 1}
                          variant="regular"
                          now={now}
                        />
                      ))}
                    </div>
                    <PaginationBar currentPage={safePage} totalPages={totalPages} filter={filter} q={qRaw} />
                  </>
                ) : (
                  <div className="rounded-lg border border-[#1e1010] bg-[#0a0505] p-5 text-center sm:p-6">
                    <p className="text-sm text-zinc-500">Không có server nào khớp bộ lọc hoặc từ khóa.</p>
                    <a href={buildHomeHref(1, { filter: null, q: null })} className="mt-2 inline-block text-sm text-sky-400 underline">
                      Xem toàn bộ danh sách
                    </a>
                  </div>
                )}
              </>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-[#1e1010] bg-[#0a0505] p-6 text-center sm:p-8">
            <p className="text-sm text-zinc-600">Chưa có server VIP Bạc hoặc đăng miễn phí nào được duyệt.</p>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
