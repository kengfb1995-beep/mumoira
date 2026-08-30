"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

type TransactionRow = {
  id: number;
  userId: number;
  email: string | null;
  amount: number;
  status: "pending" | "success" | "cancelled" | "failed" | string;
  serviceType: string;
  description: string | null;
  createdAt: string;
};

export default function AdminNapTienPage() {
  const [activeTab, setActiveTab] = useState<"approval" | "manual">("approval");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "cancelled">("pending");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pendingCount: 0, totalSuccessAmount: 0 });
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Adjust form state
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState(50000);
  const [adjustAction, setAdjustAction] = useState<"add" | "subtract">("add");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const limit = 20;

  async function fetchTransactions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/nap-tien/list?page=${page}&limit=${limit}&status=${statusFilter}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        transactions?: TransactionRow[];
        total?: number;
        stats?: { pendingCount: number; totalSuccessAmount: number };
      };
      setTransactions(data.transactions ?? []);
      setTotal(data.total ?? 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  async function handleApprove(tx: TransactionRow) {
    if (!confirm(`Xác nhận DUYỆT ĐƠN NẠP #${tx.id}?\n\n- Thành viên: #${tx.userId} (${tx.email || "Không rõ email"})\n- Số tiền cộng: +${tx.amount.toLocaleString("vi-VN")}đ`)) {
      return;
    }

    setProcessingId(tx.id);
    setActionMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/admin/nap-tien/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ transactionId: tx.id }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.message || "Lỗi duyệt nạp tiền" });
      } else {
        setActionMessage({ type: "success", text: data.message || `Đã duyệt đơn #${tx.id} thành công!` });
        await fetchTransactions();
      }
    } catch {
      setActionMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(tx: TransactionRow) {
    const reason = prompt(`Nhập lý do từ chối đơn #${tx.id} (nếu có):`, "Chưa nhận được tiền chuyển khoản");
    if (reason === null) return;

    setProcessingId(tx.id);
    setActionMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/admin/nap-tien/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ transactionId: tx.id, reason }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.message || "Lỗi từ chối đơn" });
      } else {
        setActionMessage({ type: "success", text: `Đã từ chối đơn nạp #${tx.id}` });
        await fetchTransactions();
      }
    } catch {
      setActionMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleManualAdjust(e: React.FormEvent) {
    e.preventDefault();
    const userIdNum = parseInt(adjustUserId, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      alert("Vui lòng nhập ID thành viên hợp lệ");
      return;
    }

    setAdjustLoading(true);
    setActionMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/admin/nap-tien/adjust", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          userId: userIdNum,
          amount: adjustAmount,
          action: adjustAction,
          description: adjustReason || (adjustAction === "add" ? "Admin nạp tiền thủ công" : "Admin trừ tiền"),
        }),
      });

      const data = (await res.json()) as { message?: string; newBalance?: number };
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.message || "Lỗi điều chỉnh số dư" });
      } else {
        setActionMessage({
          type: "success",
          text: `Đã ${adjustAction === "add" ? "cộng" : "trừ"} ${adjustAmount.toLocaleString("vi-VN")}đ cho user #${userIdNum}. Số dư mới: ${data.newBalance?.toLocaleString("vi-VN")}đ`,
        });
        setAdjustReason("");
        await fetchTransactions();
      }
    } catch {
      setActionMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setAdjustLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-amber-300" />
          <div>
            <h1 className="text-2xl font-extrabold text-amber-100">Duyệt Nạp Tiền & Quản lý Số Dư</h1>
            <p className="text-sm text-zinc-400">Kiểm tra thông tin chuyển khoản VietQR và duyệt tiền cho thành viên.</p>
          </div>
        </div>

        <button
          onClick={() => fetchTransactions()}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-900/30"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </header>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm font-medium ${
            actionMessage.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
              : "border-red-500/40 bg-red-950/40 text-red-200"
          }`}
        >
          {actionMessage.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/15 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <p className="text-sm text-zinc-300">Đơn chờ duyệt</p>
            </div>
            {stats.pendingCount > 0 && (
              <span className="animate-pulse rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-300 border border-yellow-500/40">
                Cần xử lý
              </span>
            )}
          </div>
          <p className="mt-2 text-3xl font-extrabold text-yellow-300">{stats.pendingCount}</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-zinc-300">Tổng nạp thành công</p>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">
            {stats.totalSuccessAmount.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-300" />
            <p className="text-sm text-zinc-300">Tổng đơn trong danh sách</p>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-100">{total}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-500/20">
        <button
          onClick={() => setActiveTab("approval")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            activeTab === "approval"
              ? "border-amber-400 text-amber-200 bg-amber-500/10"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Duyệt đơn nạp VietQR
          {stats.pendingCount > 0 && (
            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-[11px] font-bold text-black">
              {stats.pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            activeTab === "manual"
              ? "border-amber-400 text-amber-200 bg-amber-500/10"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          Nạp / Trừ tiền thủ công
        </button>
      </div>

      {activeTab === "approval" ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-500/20 bg-black/40 p-1">
              {(
                [
                  { key: "pending", label: "Chờ duyệt", count: stats.pendingCount },
                  { key: "all", label: "Tất cả" },
                  { key: "success", label: "Đã duyệt" },
                  { key: "cancelled", label: "Đã từ chối/hủy" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setStatusFilter(f.key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === f.key
                      ? "bg-amber-600/30 text-amber-100 border border-amber-500/50"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>{f.label}</span>
                  {"count" in f && typeof f.count === "number" && f.count > 0 ? (
                    <span className="rounded bg-yellow-500/30 px-1.5 py-0.2 text-[10px] text-yellow-300 font-bold">
                      {f.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-400">
              Hiển thị {transactions.length} / {total} đơn nạp
            </p>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Đang tải danh sách nạp tiền...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-black/25">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-500/20 bg-black/40 text-left text-xs font-semibold text-zinc-400">
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Thành viên</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Nội dung chuyển khoản</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {transactions.map((t) => (
                    <tr key={t.id} className="transition hover:bg-amber-950/10 text-zinc-100">
                      <td className="px-4 py-3 font-mono font-bold text-amber-300">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3">
                        {t.email ? (
                          <div>
                            <p className="font-semibold text-amber-100">{t.email}</p>
                            <p className="text-xs text-zinc-500">ID: #{t.userId}</p>
                          </div>
                        ) : (
                          <span className="font-medium text-zinc-300">User #{t.userId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-base font-extrabold text-emerald-400">
                          +{t.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <span className="rounded bg-black/60 px-2 py-1 text-amber-200 border border-amber-500/20">
                          {t.description ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {new Date(t.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            t.status === "success"
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                              : t.status === "pending"
                              ? "bg-yellow-950/60 text-yellow-300 border border-yellow-500/40 animate-pulse"
                              : "bg-red-950/60 text-red-300 border border-red-500/40"
                          }`}
                        >
                          {t.status === "success" && "● Đã duyệt"}
                          {t.status === "pending" && "● Chờ duyệt"}
                          {t.status === "cancelled" && "● Đã từ chối"}
                          {t.status !== "success" && t.status !== "pending" && t.status !== "cancelled" && t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(t)}
                              disabled={processingId === t.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-600/30 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-600/50 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {processingId === t.id ? "Đang duyệt..." : "Duyệt tiền"}
                            </button>
                            <button
                              onClick={() => handleReject(t)}
                              disabled={processingId === t.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-900/30 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-800/50 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div className="py-12 text-center text-zinc-500">
                  <Banknote className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                  Không có đơn nạp tiền nào trong mục này.
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-amber-500/30 bg-black/35 px-3 py-1.5 text-sm text-amber-100 disabled:opacity-40 hover:bg-amber-900/30"
              >
                Trước
              </button>
              <span className="text-sm text-zinc-400">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-amber-500/30 bg-black/35 px-3 py-1.5 text-sm text-amber-100 disabled:opacity-40 hover:bg-amber-900/30"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Manual Adjust Form */
        <div className="rounded-xl border border-amber-500/20 bg-black/25 p-5 max-w-2xl">
          <h2 className="text-lg font-bold text-amber-200 mb-1">Nạp hoặc Trừ tiền trực tiếp cho thành viên</h2>
          <p className="text-xs text-zinc-400 mb-4">
            Dùng để cộng tiền thưởng, sự kiện hoặc điều chỉnh số dư thành viên thủ công. Mọi thao tác đều được ghi audit log.
          </p>

          <form onSubmit={handleManualAdjust} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  ID Thành viên (User ID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  placeholder="Ví dụ: 12"
                  className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 text-sm text-amber-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  Loại thao tác <span className="text-red-400">*</span>
                </label>
                <select
                  value={adjustAction}
                  onChange={(e) => setAdjustAction(e.target.value as "add" | "subtract")}
                  className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 text-sm text-amber-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="add">➕ Cộng tiền vào tài khoản (+)</option>
                  <option value="subtract">➖ Trừ tiền khỏi tài khoản (-)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Số tiền (VNĐ) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                step={1000}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 text-sm text-amber-100 focus:border-amber-400 focus:outline-none"
              />
              <p className="mt-1 text-xs text-amber-300 font-semibold">
                Thành tiền: {adjustAmount.toLocaleString("vi-VN")}đ
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Lý do điều chỉnh <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ví dụ: Nạp bù sự kiện Đua top, hoàn tiền banner..."
                className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 text-sm text-amber-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={adjustLoading || !adjustUserId || adjustAmount <= 0}
              className={`w-full rounded-lg py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                adjustAction === "add"
                  ? "bg-emerald-600/80 hover:bg-emerald-600 text-white"
                  : "bg-red-700/80 hover:bg-red-700 text-white"
              }`}
            >
              {adjustLoading ? "Đang xử lý..." : adjustAction === "add" ? `Xác nhận CỘNG +${adjustAmount.toLocaleString("vi-VN")}đ` : `Xác nhận TRỪ -${adjustAmount.toLocaleString("vi-VN")}đ`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
