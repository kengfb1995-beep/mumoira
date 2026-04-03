import type { ComponentType, ReactNode } from "react";
import { and, desc, eq } from "drizzle-orm";
import { Crown, Gem, ShieldCheck, Sparkles } from "lucide-react";
import { BuyServicePanel } from "@/components/services/buy-service-panel";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";

const horizontalBanners = [
  {
    id: 1,
    title: "Vị trí banner trung tâm",
    size: "1200 x 280",
    cta: "Đặt quảng cáo",
  },
  {
    id: 2,
    title: "Banner sự kiện MU Private",
    size: "1200 x 220",
    cta: "Liên hệ booking",
  },
];

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-amber-300" aria-hidden="true" />
        <h2 className="text-lg font-bold text-amber-200">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const db = getDb();

  const [vipGoldServers, vipSilverServers, newServers] = await Promise.all([
    db
      .select({ id: servers.id, name: servers.name, version: servers.version, exp: servers.exp, drop: servers.drop })
      .from(servers)
      .where(and(eq(servers.status, "active"), eq(servers.vipPackageType, "vip_gold")))
      .orderBy(desc(servers.id))
      .limit(8),
    db
      .select({ id: servers.id, name: servers.name, version: servers.version, exp: servers.exp, drop: servers.drop })
      .from(servers)
      .where(and(eq(servers.status, "active"), eq(servers.vipPackageType, "vip_silver")))
      .orderBy(desc(servers.id))
      .limit(8),
    db
      .select({ id: servers.id, name: servers.name, openBetaDate: servers.openBetaDate })
      .from(servers)
      .where(eq(servers.status, "active"))
      .orderBy(desc(servers.id))
      .limit(12),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-amber-100 md:text-3xl">Danh bạ server Mu Mới Ra</h1>

      <SectionCard title="Banner quảng cáo nổi bật" icon={Sparkles}>
        <div className="grid gap-4">
          {horizontalBanners.map((banner) => (
            <article
              key={banner.id}
              className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-r from-red-950/80 via-[#321010] to-amber-950/50 p-5"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_rgba(255,220,150,0.18),_transparent_50%)]" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-amber-200">{banner.title}</h3>
                  <p className="text-sm text-zinc-200/85">Kích thước đề xuất: {banner.size}</p>
                </div>
                <a
                  href="/nap-tien"
                  className="rounded-md border border-amber-500/40 bg-black/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-black/50"
                >
                  {banner.cta}
                </a>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Server VIP Vàng" icon={Crown}>
          <div className="space-y-3">
            {vipGoldServers.length ? (
              vipGoldServers.map((server) => (
                <div key={server.id} className="rounded-md border border-yellow-500/35 bg-yellow-950/20 p-3">
                  <p className="font-semibold text-yellow-200">{server.name}</p>
                  <p className="text-sm text-zinc-200/80">
                    Phiên bản: {server.version} · EXP: {server.exp} · Drop: {server.drop}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-300">Chưa có server VIP Gold được duyệt.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Server VIP Bạc" icon={Gem}>
          <div className="space-y-3">
            {vipSilverServers.length ? (
              vipSilverServers.map((server) => (
                <div key={server.id} className="rounded-md border border-zinc-300/25 bg-zinc-900/40 p-3">
                  <p className="font-semibold text-zinc-100">{server.name}</p>
                  <p className="text-sm text-zinc-300/80">
                    Phiên bản: {server.version} · EXP: {server.exp} · Drop: {server.drop}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-300">Chưa có server VIP Silver được duyệt.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Server mới ra" icon={ShieldCheck}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {newServers.length ? (
            newServers.map((server) => (
              <article key={server.id} className="rounded-md border border-red-500/30 bg-red-950/20 p-3">
                <p className="font-semibold text-red-100">{server.name}</p>
                <p className="text-sm text-zinc-200/80">
                  Open beta: {server.openBetaDate ? new Date(server.openBetaDate).toLocaleString("vi-VN") : "Chưa cập nhật"}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-300">Chưa có server active.</p>
          )}
        </div>
      </SectionCard>

      <BuyServicePanel />
    </div>
  );
}
