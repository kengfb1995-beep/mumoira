import Link from "next/link";
import { CalendarClock, Crown, ImageIcon, Server, Wallet } from "lucide-react";
import { getAccountBanners, getAccountProfile, getAccountServers, getAccountTransactions } from "@/lib/account-queries";
import { requireUser } from "@/lib/auth";

export default async function AccountOverviewPage() {
  const session = await requireUser();
  const [user, recentTransactions, myServers, myBanners] = await Promise.all([
    getAccountProfile(session.userId),
    getAccountTransactions(session.userId, 30),
    getAccountServers(session.userId, 50),
    getAccountBanners(session.userId, 50),
  ]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const spendThisMonth = recentTransactions
    .filter((item) => {
      const date = new Date(item.createdAt);
      return item.amount < 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const activeServersCount = myServers.filter((s) => s.status === "active").length;
  const vipGoldServersCount = myServers.filter((s) => s.vipPackageType === "vip_gold").length;
  const activeBannersCount = myBanners.filter(
    (b) => b.status === "active" && new Date(b.endDate).getTime() >= Date.now(),
  ).length;

  return (
    <section className="space-y-4">
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

      {/* Quản lý dịch vụ nhanh */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/30 bg-black/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              <h3 className="font-semibold text-amber-100 text-sm">Server & VIP của bạn</h3>
            </div>
            {vipGoldServersCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <Crown className="h-3 w-3" />
                {vipGoldServersCount} VIP Vàng
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Bạn đang có <span className="font-bold text-amber-200">{myServers.length}</span> máy chủ ({activeServersCount} đang hiển thị). Có thể chỉnh sửa lại link website và banner VIP Vàng nếu nhập sai.
          </p>
          <div className="pt-1">
            <Link
              href="/tai-khoan/server"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-600/30 transition"
            >
              Quản lý & Sửa Server / VIP →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-black/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-amber-400" />
              <h3 className="font-semibold text-amber-100 text-sm">Banner quảng cáo của bạn</h3>
            </div>
            {activeBannersCount > 0 && (
              <span className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                {activeBannersCount} Đang chạy
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Bạn đang có <span className="font-bold text-amber-200">{myBanners.length}</span> banner quảng cáo. Có thể chỉnh sửa lại link ảnh hoặc link đích nếu nhập sai.
          </p>
          <div className="pt-1">
            <Link
              href="/tai-khoan/banner"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-600/30 transition"
            >
              Quản lý & Sửa Banner →
            </Link>
          </div>
        </div>
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

