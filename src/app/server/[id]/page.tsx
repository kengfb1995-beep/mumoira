import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound, permanentRedirect } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Crown,
  Diamond,
  ExternalLink,
  Gamepad2,
  Globe,
  MessageCircle,
  Share2,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildPageMetadata, buildServerJsonLd, buildServerPath, parseServerIdFromSlug, stripHtml } from "@/lib/seo";
import { serverIntroToSafeHtml } from "@/lib/server-content-html";
import { formatDateTimeFullVietnam, getCalendarDayMsInVietnam } from "@/lib/vn-datetime";
import { resolveServerSlug } from "@/lib/server-slug";
import { getSession } from "@/lib/session";
import { ServerDateEditorList } from "@/components/servers/server-date-editor-list";

export const dynamicParams = true;
export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getServerById(serverId: number) {
  try {
    const db = getDb();
    if (!db) return null;
    const row = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);
    return row[0] ?? null;
  } catch (error) {
    console.error("[ServerPage] getServerById error:", error);
    return null;
  }
}

async function getRelatedServers(currentId: number) {
  try {
    const db = getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: servers.id,
        name: servers.name,
        version: servers.version,
        exp: servers.exp,
        drop: servers.drop,
        openBetaDate: servers.openBetaDate,
        websiteUrl: servers.websiteUrl,
        bannerUrl: servers.bannerUrl,
        vipPackageType: servers.vipPackageType,
        slug: servers.slug,
      })
      .from(servers)
      .where(eq(servers.status, "active"))
      .orderBy(eq(servers.vipPackageType, "vip_gold"))
      .limit(8);
    return (rows ?? []).filter((s) => s.id !== currentId);
  } catch (error) {
    console.error("[ServerPage] getRelatedServers error:", error);
    return [];
  }
}

// ── Date formatting ───────────────────────────────────────────────────────────

function formatDateFull(ts: Date): string {
  return formatDateTimeFullVietnam(ts);
}

function getDateLabel(openBetaDate: Date | null, alphaTestDate: Date | null): {
  alphaLabel: string; alphaColor: string;
  openLabel: string; openColor: string;
} {
  const now = new Date();
  const todayMs = getCalendarDayMsInVietnam(now);

  let alphaLabel = "", alphaColor = "";
  let openLabel = "", openColor = "";

  if (alphaTestDate) {
    const dateMs = getCalendarDayMsInVietnam(new Date(alphaTestDate));
    if (dateMs === todayMs) { alphaLabel = "Alpha Test hôm nay"; alphaColor = "bg-blue-600/80 text-white"; }
    else if (dateMs > todayMs) { alphaLabel = `Alpha: ${formatDateFull(alphaTestDate)}`; alphaColor = "bg-blue-600/70 text-white"; }
  }

  if (openBetaDate) {
    const dateMs = getCalendarDayMsInVietnam(new Date(openBetaDate));
    if (dateMs === todayMs) { openLabel = "Open Beta hôm nay"; openColor = "bg-emerald-600/80 text-white"; }
    else if (dateMs > todayMs) { openLabel = `Open: ${formatDateFull(openBetaDate)}`; openColor = "bg-amber-600/70 text-white"; }
  }

  return { alphaLabel, alphaColor, openLabel, openColor };
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const serverId = parseServerIdFromSlug(resolved.id);
  if (!serverId) {
    return {
      title: "404 - Server không tồn tại | Mu Mới Ra",
      robots: { index: false, follow: false },
    };
  }

  const server = await getServerById(serverId);
  if (!server) {
    return {
      title: "404 - Server không tồn tại | Mu Mới Ra",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = buildServerPath(server.id, resolveServerSlug(server));
  const desc = `${server.name} - MU Private phiên bản ${server.version}, EXP ${server.exp}, Drop ${server.drop}. ${stripHtml(server.content ?? "").slice(0, 140)}`.trim();

  return buildPageMetadata({
    title: `${server.name} - MU ${server.version} | Mu Mới Ra`,
    description: desc,
    path: canonicalPath,
    image: server.bannerUrl ?? undefined,
    keywords: `${server.name}, mu ${server.version}, mu moi ra, mu private`,
  });
}

export async function generateStaticParams() {
  try {
    const db = getDb();
    if (!db) return [];
    const items = await db
      .select({ id: servers.id, name: servers.name, slug: servers.slug })
      .from(servers)
      .where(eq(servers.status, "active"))
      .limit(100);
    return (items ?? []).map((item) => ({
      id: `${item.id}-${resolveServerSlug(item)}`,
    }));
  } catch {
    return [];
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function ServerDetailPage({ params }: Props) {
  const resolved = await params;
  const serverId = parseServerIdFromSlug(resolved.id);
  if (!serverId) notFound();

  const [server, related, session] = await Promise.all([
    getServerById(serverId),
    getRelatedServers(serverId),
    getSession().catch(() => null),
  ]);

  if (!server) notFound();

  // 301/308 Permanent Redirect sang URL chuẩn nếu người dùng/bot truy cập bằng URL cũ hoặc id trần
  const canonicalPath = buildServerPath(server.id, resolveServerSlug(server));
  const expectedSegment = canonicalPath.replace("/server/", "");
  if (resolved.id !== expectedSegment) {
    permanentRedirect(canonicalPath);
  }

  const isOwner = session != null && session.userId === server.userId;
  const isVip = server.vipPackageType === "vip_gold";
  const { alphaLabel, alphaColor, openLabel, openColor } = getDateLabel(
    server.openBetaDate,
    server.alphaTestDate
  );
  const serverJsonLd = buildServerJsonLd(server);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serverJsonLd) }} />

      <div className="min-w-0 p-4 sm:p-5 md:p-6">
        {/* ── Breadcrumb ── */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
          <a href="/" className="hover:text-amber-300">Trang chủ</a>
          <span aria-hidden>/</span>
          <span className="text-zinc-300">Chi tiết MU</span>
        </nav>

        {/* ── Main detail card ── */}
        <article className={`mb-6 overflow-hidden rounded-xl border transition-all ${
          isVip
            ? "border-amber-500/50 bg-amber-950/10"
            : "border-[#1e1010] bg-[#0a0505]"
        }`}>
          {/* Header bar */}
          <div className={`flex flex-wrap items-center gap-2 px-3.5 py-2.5 sm:px-4 ${
            isVip ? "border-b border-amber-500/30 bg-amber-900/20" : "border-b border-[#1e1010] bg-[#0d0505]"
          }`}>
            {isVip && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-amber-400/60 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-950 shadow-sm sm:text-xs">
                <Crown className="h-3 w-3" />
                <span>VIP Vàng</span>
              </span>
            )}
            {alphaLabel && (
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold sm:text-xs ${alphaColor}`}>
                {alphaLabel}
              </span>
            )}
            {openLabel && (
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold sm:text-xs ${openColor}`}>
                {openLabel}
              </span>
            )}
          </div>

          {/* Banner + Info */}
          <div className="flex flex-col sm:flex-row sm:items-start">
            {/* Banner */}
            <div className="shrink-0 border-b border-[#1e1010] sm:border-b-0 sm:border-r border-[#1e1010]">
              <div className="relative flex min-h-[10rem] w-full items-center justify-center overflow-hidden bg-[#0d0505] px-2 py-3 sm:w-[18rem] sm:min-h-[12rem] md:w-[20rem]">
                {server.bannerUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={server.bannerUrl}
                    alt={server.name}
                    className="max-h-44 w-full object-contain object-center sm:max-h-64 md:max-h-72"
                  />
                ) : (
                  <div className="flex min-h-[10rem] w-full items-center justify-center sm:min-h-[12rem]">
                    <span className="text-xs text-zinc-700">No Image</span>
                  </div>
                )}
                {isVip && (
                  <div className="absolute right-2 top-2">
                    <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300/80 bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-950 shadow sm:text-xs">
                      <Crown className="h-3 w-3" />
                      <span>VIP</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 p-3.5 sm:p-4">
              <h1 className="mb-3 text-lg font-extrabold leading-snug text-zinc-100 sm:text-xl md:text-2xl">
                {server.name}
              </h1>

              {/* Stats grid */}
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { icon: Zap, label: "Phiên bản", value: server.version },
                  { icon: Clock, label: "EXP", value: server.exp },
                  { icon: Diamond, label: "DROP", value: server.drop },
                  { icon: CalendarDays, label: "Alpha Test", value: server.alphaTestDate ? formatDateFull(server.alphaTestDate) : "—" },
                  { icon: CalendarDays, label: "Open Beta", value: server.openBetaDate ? formatDateFull(server.openBetaDate) : "—" },
                  { icon: Shield, label: "VIP", value: isVip ? "VIP Vàng" : "Không" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2 rounded border border-[#1e1010] bg-[#0a0505] px-2.5 py-2">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-600">{label}</p>
                      <p className="truncate text-sm font-bold text-zinc-200">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div className="mb-4 flex flex-wrap gap-2">
                {server.websiteUrl ? (
                  <a
                    href={server.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-950/30 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition hover:border-amber-400 hover:bg-amber-900/50 hover:text-white"
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    <span>Trang chủ server</span>
                  </a>
                ) : null}
                {server.facebookUrl ? (
                  <a
                    href={server.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-600/50 bg-blue-950/30 px-3 py-1.5 text-xs font-bold text-blue-300 shadow-sm transition hover:border-blue-400 hover:bg-blue-900/50 hover:text-white"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden />
                    <span>Facebook</span>
                  </a>
                ) : null}
                {server.zaloUrl ? (
                  <a
                    href={server.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-sky-600/50 bg-sky-950/30 px-3 py-1.5 text-xs font-bold text-sky-300 shadow-sm transition hover:border-sky-400 hover:bg-sky-900/50 hover:text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    <span>Zalo</span>
                  </a>
                ) : null}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={server.websiteUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-black uppercase tracking-wider transition-all shadow-md active:scale-95 sm:px-6 ${
                    isVip
                      ? "border border-amber-300 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 shadow-[0_2px_14px_rgba(245,158,11,0.4)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                      : "border border-red-500/80 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-[0_2px_14px_rgba(225,29,72,0.4)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(225,29,72,0.6)]"
                  }`}
                >
                  <Gamepad2 className="h-4 w-4" aria-hidden />
                  <span>Chơi ngay</span>
                </a>
                {server.websiteUrl ? (
                  <a
                    href={server.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2d4460] bg-[#121c27]/90 px-4 py-2.5 text-sm font-bold text-zinc-200 shadow-sm transition hover:border-amber-400/60 hover:text-white sm:px-5"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    <span>Truy cập website</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Content section */}
          {server.content ? (
            <div className="border-t border-[#1e1010] px-3.5 py-4 sm:px-4">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-300">
                <Crown className="h-4 w-4" aria-hidden />
                Giới thiệu server
              </h2>
              <div
                className="rich-html-body prose prose-invert w-full max-w-none text-[15px] leading-[1.7] text-zinc-200 sm:text-base prose-headings:text-zinc-100 prose-p:mb-3 prose-p:mt-0 prose-p:text-zinc-200 prose-p:leading-relaxed prose-li:text-zinc-200 prose-strong:text-zinc-100 prose-a:text-amber-400 prose-a:underline-offset-2 hover:prose-a:text-amber-300 prose-ul:my-3 prose-ol:my-3"
                dangerouslySetInnerHTML={{ __html: serverIntroToSafeHtml(server.content) }}
              />
            </div>
          ) : null}

          {isOwner ? (
            <div className="border-t border-[#1e1010] px-3.5 py-4 sm:px-4">
              <p className="mb-2 text-xs font-semibold text-amber-200">Chỉnh ngày Alpha / Open (hiển thị trên danh sách)</p>
              <ServerDateEditorList
                serverId={server.id}
                initialAlpha={server.alphaTestDate}
                initialOpen={server.openBetaDate}
              />
            </div>
          ) : null}
        </article>

        {/* ── Related servers ── */}
        {related.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
              <h2 className="text-sm font-bold text-amber-200">Server khác</h2>
            </div>
            <div className="space-y-2">
              {related.map((rel, idx) => {
                const relSlug = resolveServerSlug(rel);
                const relHref = buildServerPath(rel.id, relSlug);
                const relIsVip = rel.vipPackageType === "vip_gold";
                return (
                  <article
                    key={rel.id}
                    className={`flex min-w-0 items-center gap-3 rounded-lg border p-2.5 transition-all ${
                      relIsVip
                        ? "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/60"
                        : "border-[#1e1010] bg-[#0a0505] hover:border-red-800/30"
                    }`}
                  >
                    <span className="shrink-0 text-xs font-bold text-zinc-600">{idx + 1}</span>
                    {rel.bannerUrl ? (
                      <div className="h-10 w-16 shrink-0 overflow-hidden rounded border border-[#2a1515] bg-[#0d0505]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={rel.bannerUrl} alt={rel.name} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <a href={relHref} className="block truncate text-sm font-semibold text-zinc-200 hover:text-amber-300">
                        {rel.name}
                      </a>
                      <p className="text-[11px] text-zinc-500">
                        {rel.version} · Exp: {rel.exp} · Drop: {rel.drop}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {relIsVip ? (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-400/50 bg-amber-950/60 px-2 py-0.5 text-[10px] font-black text-amber-300">
                          <Crown className="h-3 w-3" />
                          <span>VIP</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-zinc-600">—</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </>
  );
}
