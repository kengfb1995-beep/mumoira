/// <reference types="@cloudflare/workers-types" />
import { desc } from "drizzle-orm";
import { Crown, Flag, Image as ImageIcon, KeyRound, Users } from "lucide-react";
import { banners, cronRuns, servers, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSecureSetting } from "@/lib/secure-settings";
import { GroqKeyForm } from "@/components/admin/groq-key-form";
import { ImportPostForm } from "@/components/admin/import-post-form";
import { ServerQuickActions } from "@/components/admin/server-quick-actions";
import { SystemStatusCard } from "@/components/admin/system-status-card";

export default async function AdminPage() {
  await requireAdmin();
  const db = getDb() as any;

  const [allUsers, allServers, allBanners, groqKey, recentCronRuns] = await Promise.all([
    db
      .select({ id: users.id, email: users.email, role: users.role, balance: users.balance })
      .from(users)
      .orderBy(desc(users.id))
      .limit(10),
    db
      .select({ id: servers.id, name: servers.name, vipPackageType: servers.vipPackageType, status: servers.status })
      .from(servers)
      .orderBy(desc(servers.id))
      .limit(10),
    db
      .select({ id: banners.id, position: banners.position, status: banners.status, imageUrl: banners.imageUrl })
      .from(banners)
      .orderBy(desc(banners.id))
      .limit(10),
    getSecureSetting("GROQ_API_KEY"),
    db
      .select({
        id: cronRuns.id,
        taskName: cronRuns.taskName,
        success: cronRuns.success,
        processedCount: cronRuns.processedCount,
        durationMs: cronRuns.durationMs,
        runDate: cronRuns.runDate,
        createdAt: cronRuns.createdAt,
      })
      .from(cronRuns)
      .orderBy(desc(cronRuns.id))
      .limit(10),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-black/20 p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-300" />
          <h1 className="text-2xl font-bold text-amber-100">Admin Dashboard</h1>
        </div>
        <a
          href="/admin/analytics"
          className="rounded-lg border border-amber-500/30 bg-black/30 px-3 py-2 text-sm text-amber-100 transition-colors hover:bg-black/50"
        >
          Xem Analytics
        </a>
      </div>

      <SystemStatusCard />

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-semibold text-amber-200">Cập nhật GROQ API Key</h2>
        </div>
        <GroqKeyForm defaultValue={groqKey ?? ""} />
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-amber-200">Auto Scrape + AI Rewrite bài viết</h2>
        <p className="mb-3 mt-1 text-sm text-zinc-300">
          Dán URL bài gốc, hệ thống sẽ cào nội dung bằng cheerio, rewrite với Groq và lưu vào bảng posts.
        </p>
        <ImportPostForm />
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-amber-200">Cron bảo trì gần đây</h2>
        <div className="mt-3 space-y-2 text-sm">
          {recentCronRuns.map((run: any) => (
            <div key={run.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2">
              <p className="font-medium text-amber-100">
                {run.taskName} · {run.success ? "thành công" : "thất bại"}
              </p>
              <p className="text-zinc-300">
                Xử lý: {run.processedCount} · Duration: {run.durationMs ?? 0}ms · Ngày: {run.runDate}
              </p>
              <p className="text-zinc-400">{new Date(run.createdAt).toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Users mới nhất</h2>
          </div>
          <div className="space-y-2 text-sm">
            {allUsers.map((item: any) => (
              <div key={item.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2">
                <p className="font-medium text-amber-100">{item.email}</p>
                <p className="text-zinc-300">Role: {item.role} · Số dư: {item.balance.toLocaleString("vi-VN")}đ</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Servers mới nhất (duyệt nhanh)</h2>
          </div>
          <ServerQuickActions initialServers={allServers} />
        </section>

        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Banners mới nhất</h2>
          </div>
          <div className="space-y-2 text-sm">
            {allBanners.map((item: any) => (
              <div key={item.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2">
                <p className="font-medium text-amber-100">{item.position}</p>
                <p className="truncate text-zinc-300">{item.imageUrl}</p>
                <p className="text-zinc-300">Trạng thái: {item.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
