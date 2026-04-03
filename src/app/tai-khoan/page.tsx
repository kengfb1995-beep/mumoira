import { desc, eq } from "drizzle-orm";
import { CalendarClock, Receipt, Wallet } from "lucide-react";
import { ServerDateEditorList } from "@/components/servers/server-date-editor-list";
import { servers, transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const session = await requireUser();
  const db = getDb();

  const [profile, recentTransactions, myServers] = await Promise.all([
    db
      .select({ email: users.email, balance: users.balance })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1),
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        serviceType: transactions.serviceType,
        description: transactions.description,
        referenceId: transactions.referenceId,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, session.userId))
      .orderBy(desc(transactions.id))
      .limit(30),
    db
      .select({
        id: servers.id,
        name: servers.name,
        status: servers.status,
        vipPackageType: servers.vipPackageType,
        openBetaDate: servers.openBetaDate,
        alphaTestDate: servers.alphaTestDate,
      })
      .from(servers)
      .where(eq(servers.userId, session.userId))
      .orderBy(desc(servers.id))
      .limit(20),
  ]);

  const user = profile[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const spendThisMonth = recentTransactions
    .filter((item) => {
      const date = new Date(item.createdAt);
      return item.amount < 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-100">Tài khoản của tôi</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <p className="text-sm text-zinc-300">Email</p>
          <p className="mt-1 font-semibold text-amber-100">{user?.email}</p>
        </article>

        <article className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-300" />
            <p className="text-sm text-zinc-300">Số dư</p>
          </div>
          <p className="mt-1 text-lg font-bold text-amber-200">{(user?.balance ?? 0).toLocaleString("vi-VN")}đ</p>
        </article>

        <article className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-300" />
            <p className="text-sm text-zinc-300">Chi tiêu tháng này</p>
          </div>
          <p className="mt-1 text-lg font-bold text-amber-200">{spendThisMonth.toLocaleString("vi-VN")}đ</p>
        </article>
      </div>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <h2 className="mb-3 text-lg font-semibold text-amber-200">Server của bạn (sửa Open/Alpha Test)</h2>
        <ServerDateEditorList
          servers={myServers}
          activities={recentTransactions
            .filter((tx) => tx.referenceId != null)
            .map((tx) => ({
              id: tx.id,
              referenceId: tx.referenceId ?? 0,
              serviceType: tx.serviceType ?? "topup",
              amount: tx.amount,
              description: tx.description,
              createdAt: tx.createdAt,
            }))}
        />
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-semibold text-amber-200">Lịch sử giao dịch</h2>
        </div>

        <div className="space-y-2">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="rounded-md border border-amber-500/20 bg-black/30 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-amber-100">{tx.description ?? tx.serviceType ?? "Giao dịch"}</p>
                <p className={tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <p className="text-zinc-300">
                Trạng thái: {tx.status} · Loại: {tx.serviceType ?? "topup"} · Thời gian: {new Date(tx.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
