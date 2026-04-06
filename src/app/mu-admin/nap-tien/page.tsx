"use client";

import { useState, useEffect } from "react";
import { CreditCard, Download, Eye, Plus, Search, TrendingUp, Wallet } from "lucide-react";

type TransactionRow = {
  id: number;
  userId: number;
  email: string | null;
  amount: number;
  status: string;
  serviceType: string;
  description: string | null;
  createdAt: string;
};

export default function NapTienPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/giao-dich?page=${page}&limit=${limit}`);
        if (!res.ok) return;
        const data = (await res.json()) as { transactions?: TransactionRow[]; total?: number };
        setTransactions(data.transactions ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Nạp tiền & Giao dịch</h1>
          <p className="text-sm text-zinc-400">Xem lịch sử nạp tiền và tạo nạp tiền thủ công cho thành viên.</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-zinc-300">Tổng nạp trong trang</p>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-400">{totalAmount.toLocaleString("vi-VN")}đ</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-300" />
            <p className="text-sm text-zinc-300">Giao dịch trong trang</p>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-100">{transactions.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-300" />
            <p className="text-sm text-zinc-300">Trang hiện tại</p>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-100">{page} / {totalPages}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-500/20 text-left text-zinc-400">
                <th className="pb-2 pr-4 font-medium">ID</th>
                <th className="pb-2 pr-4 font-medium">Người dùng</th>
                <th className="pb-2 pr-4 font-medium">Loại</th>
                <th className="pb-2 pr-4 font-medium">Số tiền</th>
                <th className="pb-2 pr-4 font-medium">Trạng thái</th>
                <th className="pb-2 font-medium">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-amber-500/10 text-zinc-100">
                  <td className="py-3 pr-4 font-mono text-zinc-400">#{t.id}</td>
                  <td className="py-3 pr-4">
                    {t.email ? (
                      <div>
                        <p className="font-medium">{t.email}</p>
                        <p className="text-xs text-zinc-500">ID: #{t.userId}</p>
                      </div>
                    ) : (
                      <span className="text-zinc-500">#{t.userId}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{t.serviceType}</span>
                  </td>
                  <td className={`py-3 pr-4 font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      t.status === "success" ? "bg-emerald-900/50 text-emerald-300" :
                      t.status === "pending" ? "bg-yellow-900/50 text-yellow-300" :
                      "bg-red-900/50 text-red-300"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-400">
                    <span className="line-clamp-1 max-w-[200px]">{t.description ?? "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Chưa có giao dịch nào.</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-md border border-amber-500/30 bg-black/35 px-3 py-1.5 text-sm text-amber-100 disabled:opacity-40 hover:bg-amber-900/30">
            Trước
          </button>
          <span className="text-sm text-zinc-400">Trang {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-md border border-amber-500/30 bg-black/35 px-3 py-1.5 text-sm text-amber-100 disabled:opacity-40 hover:bg-amber-900/30">
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
