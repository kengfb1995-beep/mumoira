import Link from "next/link";
import { CalendarClock, Wallet } from "lucide-react";
import { getAccountProfile, getAccountTransactions } from "@/lib/account-queries";
import { requireUser } from "@/lib/auth";

export default async function AccountOverviewPage() {
  const session = await requireUser();
  const [user, recentTransactions] = await Promise.all([
    getAccountProfile(session.userId),
    getAccountTransactions(session.userId, 30),
  ]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const spendThisMonth = recentTransactions
    .filter((item) => {
      const date = new Date(item.createdAt);
      return item.amount < 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-amber-200 sm:text-xl">Tổng quan</h2>
      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-3">
        <article className="rounded-xl border border-amber-500/20 bg-black/25 p-3 sm:p-4">
          <p className="text-xs text-zinc-300 sm:text-sm">Email</p>
          <p className="mt-1 truncate font-semibold text-amber-100 sm:text-sm">{user?.email}</p>
        </article>

        <article className="rounded-xl border border-amber-500/20 bg-black/25 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Wallet className="h-3.5 w-3.5 text-amber-300 sm:h-4 sm:w-4" />
            <p className="text-xs text-zinc-300 sm:text-sm">Số dư</p>
          </div>
          <p className="mt-1 text-lg font-bold text-amber-200 sm:text-xl">{(user?.balance ?? 0).toLocaleString("vi-VN")}đ</p>
        </article>

        <article className="rounded-xl border border-amber-500/20 bg-black/25 p-3 sm:p-4 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CalendarClock className="h-3.5 w-3.5 text-amber-300 sm:h-4 sm:w-4" />
            <p className="text-xs text-zinc-300 sm:text-sm">Chi tiêu tháng này</p>
          </div>
          <p className="mt-1 text-lg font-bold text-amber-200 sm:text-xl">{spendThisMonth.toLocaleString("vi-VN")}đ</p>
        </article>
      </div>

      <p className="text-xs text-zinc-400 sm:text-sm">
        Nạp tiền tại{" "}
        <Link href="/nap-tien" className="font-semibold text-amber-300 hover:underline">
          trang nạp tiền
        </Link>
        .
      </p>
    </section>
  );
}
