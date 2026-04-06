import { Receipt } from "lucide-react";
import { getAccountTransactions } from "@/lib/account-queries";
import { requireUser } from "@/lib/auth";

export default async function AccountTransactionsPage() {
  const session = await requireUser();
  const recentTransactions = await getAccountTransactions(session.userId, 30);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-amber-300 sm:h-6 sm:w-6" />
        <h2 className="text-lg font-semibold text-amber-200 sm:text-xl">Lịch sử giao dịch</h2>
      </div>

      <div className="space-y-2">
        {recentTransactions.length === 0 ? (
          <p className="rounded-md border border-amber-500/20 bg-black/30 p-3 text-xs text-zinc-400 sm:text-sm">
            Chưa có giao dịch hoàn tất. Giao dịch nạp tiền chỉ xuất hiện sau khi thanh toán PayOS thành công.
          </p>
        ) : null}
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2.5 text-xs sm:p-3 sm:text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-amber-100">{tx.description ?? tx.serviceType ?? "Giao dịch"}</p>
              <p className={tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <p className="mt-0.5 text-zinc-300">
              Loại: {tx.serviceType ?? "topup"} · Thời gian: {new Date(tx.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
