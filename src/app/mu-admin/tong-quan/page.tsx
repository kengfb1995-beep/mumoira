import { count, desc } from "drizzle-orm";
import { Crown, Flag, ImageIcon, KeyRound, ShieldCheck, Users } from "lucide-react";
import { banners, cronRuns, servers, transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";

export default async function AdminTongQuanPage() {
  const db = getDb();

  const [allUsers, allServers, allBanners, recentCronRuns, recentTransactions, [userCount], [serverCount], [bannerCount]] = await Promise.all([
    db.select({ id: users.id, email: users.email, role: users.role, balance: users.balance, createdAt: users.createdAt }).from(users).orderBy(desc(users.id)).limit(5),
    db.select({ id: servers.id, name: servers.name, version: servers.version, exp: servers.exp, vipPackageType: servers.vipPackageType, status: servers.status, createdAt: servers.createdAt }).from(servers).orderBy(desc(servers.id)).limit(5),
    db.select({ id: banners.id, position: banners.position, status: banners.status, imageUrl: banners.imageUrl }).from(banners).orderBy(desc(banners.id)).limit(5),
    db.select({ id: cronRuns.id, taskName: cronRuns.taskName, success: cronRuns.success, processedCount: cronRuns.processedCount, durationMs: cronRuns.durationMs, runDate: cronRuns.runDate, createdAt: cronRuns.createdAt }).from(cronRuns).orderBy(desc(cronRuns.id)).limit(5),
    db.select({ id: transactions.id, userId: transactions.userId, amount: transactions.amount, status: transactions.status, serviceType: transactions.serviceType, description: transactions.description, createdAt: transactions.createdAt }).from(transactions).orderBy(desc(transactions.id)).limit(5),
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(servers),
    db.select({ n: count() }).from(banners),
  ]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#2b1010] via-[#190b0b] to-[#100909] p-5">
        <div className="flex items-center gap-2">
          <Crown className="h-7 w-7 text-amber-300" />
          <div>
            <h1 className="text-3xl font-extrabold text-amber-100">Tổng quan</h1>
            <p className="text-sm text-zinc-300">Quản trị dữ liệu người dùng, server, banner và vận hành hệ thống.</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Người dùng" value={Number(userCount?.n ?? 0)} icon={<Users className="h-4 w-4 text-amber-300" />} sub="Tổng cộng" />
        <StatCard label="Server" value={Number(serverCount?.n ?? 0)} icon={<Flag className="h-4 w-4 text-amber-300" />} sub="Tổng cộng" />
        <StatCard label="Banner" value={Number(bannerCount?.n ?? 0)} icon={<ImageIcon className="h-4 w-4 text-amber-300" />} sub="Tổng cộng" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* Users */}
        <section className="flex min-h-0 flex-col rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <Users className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Người dùng mới nhất</h2>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="flex gap-3 rounded-md border border-amber-500/20 bg-black/30 p-2.5 sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-amber-100" title={u.email}>
                    {u.email}
                  </p>
                  <p className="truncate text-xs text-zinc-400 sm:text-sm">
                    {u.role} · {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <p className="shrink-0 self-start text-right font-bold tabular-nums text-emerald-400 sm:self-center">
                  {u.balance.toLocaleString("vi-VN")}đ
                </p>
              </div>
            ))}
            {allUsers.length === 0 && <p className="text-zinc-400">Chưa có người dùng.</p>}
          </div>
        </section>

        {/* Servers */}
        <section className="flex min-h-0 flex-col rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <Flag className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Server mới nhất</h2>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
            {allServers.map((s) => (
              <div key={s.id} className="flex gap-3 rounded-md border border-amber-500/20 bg-black/30 p-2.5 sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-amber-100" title={s.name}>
                    {s.name}
                  </p>
                  <p className="truncate text-xs text-zinc-400 sm:text-sm">
                    v{s.version} · Exp {s.exp}
                  </p>
                </div>
                <span
                  className={`shrink-0 self-start rounded px-2 py-0.5 text-xs font-semibold sm:self-center ${
                    s.status === "active"
                      ? "bg-emerald-900/50 text-emerald-300"
                      : s.status === "pending"
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-red-900/50 text-red-300"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
            {allServers.length === 0 && <p className="text-zinc-400">Chưa có server.</p>}
          </div>
        </section>

        {/* Transactions */}
        <section className="flex min-h-0 flex-col rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Giao dịch gần nhất</h2>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex gap-3 rounded-md border border-amber-500/20 bg-black/30 p-2.5 sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-amber-100">
                    #{t.userId} · {t.serviceType}
                  </p>
                  <p className="truncate text-xs text-zinc-400 sm:text-sm" title={t.description ?? ""}>
                    {t.description}
                  </p>
                </div>
                <p
                  className={`shrink-0 self-start text-right font-bold tabular-nums sm:self-center ${
                    t.amount >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toLocaleString("vi-VN")}đ
                </p>
              </div>
            ))}
            {recentTransactions.length === 0 && <p className="text-zinc-400">Chưa có giao dịch.</p>}
          </div>
        </section>

        {/* Cron runs */}
        <section className="flex min-h-0 flex-col rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Tác vụ hệ thống</h2>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
            {recentCronRuns.map((r) => (
              <div key={r.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2.5">
                <p className="font-medium text-amber-100">
                  {r.taskName} · <span className={r.success ? "text-emerald-400" : "text-red-400"}>
                    {r.success ? "Thành công" : "Thất bại"}
                  </span>
                </p>
                <p className="text-zinc-300">Xử lý: {r.processedCount} · {r.durationMs ?? 0}ms</p>
              </div>
            ))}
            {recentCronRuns.length === 0 && <p className="text-zinc-400">Chưa có tác vụ.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: number; icon: React.ReactNode; sub: string }) {
  return (
    <article className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-zinc-300">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-amber-100">{value}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </article>
  );
}
