import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Crown,
  Diamond,
  ExternalLink,
  Globe,
  MessageCircle,
  Share2,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildPageMetadata, buildServerJsonLd, buildServerPath, parseServerIdFromSlug } from "@/lib/seo";
import { serverIntroToSafeHtml } from "@/lib/server-content-html";
import { formatDateTimeFullVietnam, getCalendarDayMsInVietnam } from "@/lib/vn-datetime";
import { resolveServerSlug } from "@/lib/server-slug";
import { getSession } from "@/lib/session";
import { ServerDateEditorList } from "@/components/servers/server-date-editor-list";

type Props = {
  params: Promise<{ id: string }>;
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getServerById(serverId: number) {
  const db = getDb();
  const row = await db
    .select()
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);
  return row[0] ?? null;
}

async function getRelatedServers(currentId: number) {
  const db = getDb();
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
  return rows.filter((s) => s.id !== currentId);
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
    return buildPageMetadata({ title: "Server không tồn tại", path: "/" });
  }
  const db = getDb();
  if (!db) {
    return buildPageMetadata({ title: "Server không tồn tại", path: "/" });
  }
  const server = await getServerById(serverId);
  if (!server) {
    return buildPageMetadata({ title: "Server không tồn tại", path: "/" });
  }
  return buildPageMetadata({
    title: `${server.name} | Mu Mới Ra`,
    description: `${server.name} - MU ${server.version}, EXP ${server.exp}, Drop ${server.drop}.`,
    path: buildServerPath(server.id, resolveServerSlug(server)),
    image: server.bannerUrl ?? undefined,
  });
}

export async function generateStaticParams() {
  const db = getDb();
  const items = await db.select({ id: servers.id }).from(servers).limit(200);
  return items.map((item) => ({ id: String(item.id) }));
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function ServerDetailPage({ params }: Props) {
  const resolved = await params;
  const serverId = parseServerIdFromSlug(resolved.id);
  if (!serverId) notFound();

  const db = getDb();
  if (!db) notFound();

  const [server, related, session] = await Promise.all([
    getServerById(serverId),
    getRelatedServers(serverId),
    getSession(),
  ]);
  if (!server) notFound();

  const isOwner = session != null && session.userId === server.userId;

  const slug = resolveServerSlug(server);
  const href = buildServerPath(server.id, slug);
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
              <span className="shrink-0 rounded-sm bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white ring-1 ring-amber-400/50 sm:text-xs">
                ★ Vip Vàng
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

          {/* Banner + Info — align top so banner height is not stretched; object-contain shows full image */}
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
                    <span className="rounded-sm bg-gradient-to-b from-amber-400 to-amber-700 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white sm:text-xs">
                      ★ VIP
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
                  { icon: Shield, label: "VIP", value: isVip ? "★ Vip Vàng" : "Không" },
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
                    className="inline-flex items-center gap-1.5 rounded border border-amber-700/50 bg-amber-900/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-600 hover:bg-amber-900/40"
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    Trang chủ server
                  </a>
                ) : null}
                {server.facebookUrl ? (
                  <a
                    href={server.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-blue-700/50 bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:border-blue-600 hover:bg-blue-900/40"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden />
                    Facebook
                  </a>
                ) : null}
                {server.zaloUrl ? (
                  <a
                    href={server.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-blue-400/50 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-400/20"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    Zalo
                  </a>
                ) : null}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={server.websiteUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded px-4 py-2.5 text-sm font-bold transition sm:px-5 ${
                    isVip
                      ? "border border-amber-500/60 bg-amber-600/40 text-amber-100 hover:bg-amber-600/60"
                      : "border border-red-700/50 bg-red-900/40 text-red-200 hover:bg-red-800/50"
                  }`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Chơi ngay
                </a>
                {server.websiteUrl ? (
                  <a
                    href={server.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-[#2a1515] bg-[#0a0505] px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-red-700/40 hover:text-zinc-200 sm:px-5"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Truy cập website
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
                      <span className={`text-[11px] font-semibold ${relIsVip ? "text-amber-400" : "text-zinc-500"}`}>
                        {relIsVip ? "★ VIP" : "—"}
                      </span>
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
