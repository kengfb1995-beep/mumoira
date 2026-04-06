"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Minus, Plus, Search, Shield, User, Users, Wallet } from "lucide-react";
import { withCsrfHeaders } from "@/lib/csrf-client";

type UserRow = {
  id: number;
  email: string;
  role: "super_admin" | "admin" | "user";
  balance: number;
  createdAt: string;
};

export default function NguoiDungPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Adjust balance modal
  const [adjusting, setAdjusting] = useState<UserRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustAction, setAdjustAction] = useState<"add" | "subtract">("add");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjustMsg, setAdjustMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/nguoi-dung?${params}`);
      if (!res.ok) { setError("Không tải được danh sách."); return; }
      const data = (await res.json()) as { users?: UserRow[]; total?: number };
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjusting) return;
    setAdjustMsg("");

    try {
      const amountDigits = adjustAmount.replace(/\D/g, "");
      const amount = parseInt(amountDigits, 10);
      const res = await fetch("/api/admin/nap-tien/adjust", {
        method: "PATCH",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          userId: adjusting.id,
          amount,
          action: adjustAction,
          description: adjustDesc.trim(),
        }),
      });

      const data = (await res.json()) as {
        message?: string;
        newBalance?: number;
        issues?: { path: (string | number)[]; message: string }[];
      };
      if (!res.ok) {
        const firstIssue = data.issues?.[0]?.message;
        setAdjustMsg(firstIssue ? `${data.message ?? "Lỗi"}: ${firstIssue}` : (data.message ?? "Thất bại"));
        return;
      }

      setAdjustMsg(`Thành công! Số dư mới: ${(data.newBalance ?? 0).toLocaleString("vi-VN")}đ`);
      setTimeout(() => {
        setAdjusting(null);
        setAdjustAmount("");
        setAdjustDesc("");
        setAdjustMsg("");
        fetchUsers();
      }, 1500);
    } catch {
      setAdjustMsg("Lỗi kết nối.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Users className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Người dùng</h1>
          <p className="text-sm text-zinc-400">Quản lý tài khoản và số dư thành viên.</p>
        </div>
      </header>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-md border border-amber-500/30 bg-black/50 pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/70 focus:outline-none"
          />
        </div>
        <span className="text-sm text-zinc-400">{total} người dùng</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400">Đang tải...</div>
      ) : error ? (
        <div className="rounded-md border border-red-700/50 bg-red-950/40 p-4 text-red-200">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-500/20 text-left text-zinc-400">
                <th className="pb-2 pr-4 font-medium">ID</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Vai trò</th>
                <th className="pb-2 pr-4 font-medium">Số dư</th>
                <th className="pb-2 pr-4 font-medium">Ngày tạo</th>
                <th className="pb-2 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-amber-500/10 text-zinc-100">
                  <td className="py-3 pr-4 font-mono text-zinc-400">#{u.id}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                      u.role === "super_admin" ? "bg-purple-900/50 text-purple-300" :
                      u.role === "admin" ? "bg-red-900/50 text-red-300" :
                      "bg-zinc-800 text-zinc-300"
                    }`}>
                      {u.role === "super_admin" ? <Shield className="h-3 w-3" /> :
                       u.role === "admin" ? <Crown className="h-3 w-3" /> :
                       <User className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-bold text-emerald-400">
                    {u.balance.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setAdjusting(u)}
                      className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-900/30 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/50"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Điều chỉnh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="py-8 text-center text-zinc-500">Không có người dùng nào.</p>}
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

      {/* Adjust Balance Modal */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/35 bg-[#120808] p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-amber-100">Điều chỉnh số dư</h3>
            <p className="mb-4 text-sm text-zinc-400">{adjusting.email}</p>
            <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">
              Số dư hiện tại: <strong>{adjusting.balance.toLocaleString("vi-VN")}đ</strong>
            </p>

            <form onSubmit={handleAdjust} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustAction("add")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    adjustAction === "add"
                      ? "border-emerald-500/60 bg-emerald-900/50 text-emerald-200"
                      : "border-amber-500/30 text-zinc-400 hover:bg-black/30"
                  }`}
                >
                  <Plus className="mr-1 inline h-4 w-4" /> Cộng tiền
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction("subtract")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    adjustAction === "subtract"
                      ? "border-red-500/60 bg-red-900/50 text-red-200"
                      : "border-amber-500/30 text-zinc-400 hover:bg-black/30"
                  }`}
                >
                  <Minus className="mr-1 inline h-4 w-4" /> Trừ tiền
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  min={1000}
                  max={1_000_000_000}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="VD: 50000"
                  required
                  className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/70 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">Lý do</label>
                <input
                  type="text"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  placeholder="VD: Thưởng đăng server"
                  required
                  className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/70 focus:outline-none"
                />
              </div>

              {adjustMsg && (
                <div className={`rounded-md p-3 text-sm ${adjustMsg.includes("Thành công") ? "border border-emerald-500/40 bg-emerald-950/40 text-emerald-200" : "border border-red-500/40 bg-red-950/40 text-red-200"}`}>
                  {adjustMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAdjusting(null); setAdjustMsg(""); }}
                  className="flex-1 rounded-md border border-zinc-600/50 bg-zinc-900/50 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-bold transition ${
                    adjustAction === "add"
                      ? "border-emerald-600/60 bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700"
                      : "border-red-600/60 bg-red-800/80 text-red-100 hover:bg-red-700"
                  }`}
                >
                  Xác nhận {adjustAction === "add" ? "cộng" : "trừ"} tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
