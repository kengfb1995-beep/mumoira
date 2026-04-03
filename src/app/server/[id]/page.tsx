import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { buildPageMetadata, buildServerJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

async function getServerById(serverId: number) {
  const db = getDb();
  const row = await db
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
      status: servers.status,
    })
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);

  return row[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const serverId = Number(resolved.id);

  if (!Number.isFinite(serverId)) {
    return buildPageMetadata({
      title: "Server không tồn tại | Mu Mới Ra",
      description: "Không tìm thấy thông tin server MU Private.",
      path: "/",
    });
  }

  const server = await getServerById(serverId);
  if (!server) {
    return buildPageMetadata({
      title: "Server không tồn tại | Mu Mới Ra",
      description: "Không tìm thấy thông tin server MU Private.",
      path: "/",
    });
  }

  return buildPageMetadata({
    title: `${server.name} | Mu Mới Ra`,
    description: `${server.name} - MU ${server.version}, EXP ${server.exp}, Drop ${server.drop}.`,
    path: `/server/${server.id}`,
    image: server.bannerUrl,
  });
}

export async function generateStaticParams() {
  const db = getDb();
  const items = await db.select({ id: servers.id }).from(servers).limit(200);
  return items.map((item) => ({ id: String(item.id) }));
}

export default async function ServerDetailPage({ params }: Props) {
  const resolved = await params;
  const serverId = Number(resolved.id);
  if (!Number.isFinite(serverId)) {
    notFound();
  }

  const server = await getServerById(serverId);
  if (!server) {
    notFound();
  }

  const serverJsonLd = buildServerJsonLd(server);

  return (
    <article className="space-y-4 rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serverJsonLd) }} />

      <header>
        <h1 className="text-2xl font-bold text-amber-100 md:text-3xl">{server.name}</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Phiên bản: {server.version} · EXP: {server.exp} · Drop: {server.drop}
        </p>
      </header>

      <div className="rounded-lg border border-amber-500/20 bg-black/30 p-4 text-sm text-zinc-200">
        <p>Gói VIP: {server.vipPackageType}</p>
        <p>Trạng thái: {server.status}</p>
        <p>
          Open Beta: {server.openBetaDate ? new Date(server.openBetaDate).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
        </p>
        <a href={server.websiteUrl} target="_blank" rel="noreferrer" className="text-amber-300 hover:underline">
          Truy cập website server
        </a>
      </div>
    </article>
  );
}
