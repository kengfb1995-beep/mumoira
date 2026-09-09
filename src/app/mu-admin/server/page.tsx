"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  Filter,
  Flag,
  Globe,
  Layers,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
  XCircle,
  Zap,
} from "lucide-react";

type ServerRow = {
  id: number;
  name: string;
  userId: number;
  userEmail?: string | null;
  version: string;
  exp: string;
  drop: string;
  websiteUrl: string;
  content?: string;
  seoKeywords?: string;
  slug?: string;
  bannerUrl?: string | null;
  facebookUrl?: string | null;
  zaloUrl?: string | null;
  openBetaDate?: string | number | null;
  alphaTestDate?: string | number | null;
  vipPackageType: string;
  status: string;
  createdAt: string;
};

const statusOptions = [
  { value: "pending", label: "Chờ duyệt", color: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40" },
  { value: "active", label: "Hoạt động", color: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" },
  { value: "rejected", label: "Từ chối", color: "bg-rose-900/40 text-rose-300 border-rose-700/40" },
  { value: "archived", label: "Lưu trữ", color: "bg-zinc-800 text-zinc-400 border-zinc-700" },
] as const;

export default function ServerPage() {
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "pending" | "active" | "vip" | "rejected">("all");

  // Detail Modal
  const [detailServer, setDetailServer] = useState<ServerRow | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/server", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError("forbidden");
        return;
      }
      if (!res.ok) {
        setError("Không thể tải danh sách server. Vui lòng thử lại.");
        return;
      }
      const data = (await res.json()) as { servers?: ServerRow[] };
      setServers(data.servers ?? []);
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Dismiss action success notification after 4s
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  async function updateServer(id: number, patch: { status?: string; vipPackageType?: string }) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/server", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        setServers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
        );
        if (detailServer && detailServer.id === id) {
          setDetailServer((prev) => (prev ? { ...prev, ...patch } : null));
        }
        setActionSuccess(`Đã cập nhật server #${id}`);
      } else {
        alert("Cập nhật thất bại. Vui lòng thử lại.");
      }
    } finally {
      setUpdating(null);
    }
  }

  async function approveAllPending() {
    const pendingCount = servers.filter((s) => s.status === "pending").length;
    if (pendingCount === 0) {
      alert("Hiện không có server nào đang chờ duyệt.");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn DUYỆT TẤT CẢ ${pendingCount} server đang chờ duyệt sang trạng thái Hoạt động?`)) {
      return;
    }

    setApprovingAll(true);
    try {
      const res = await fetch("/api/admin/server", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_all_pending" }),
      });
      if (res.ok) {
        setServers((prev) =>
          prev.map((s) => (s.status === "pending" ? { ...s, status: "active" } : s))
        );
        setActionSuccess(`Đã duyệt thành công tất cả ${pendingCount} máy chủ chờ duyệt!`);
      } else {
        alert("Duyệt hàng loạt thất bại. Vui lòng thử lại.");
      }
    } finally {
      setApprovingAll(false);
    }
  }

  async function deleteServer(id: number) {
    if (!confirm(`Xóa vĩnh viễn server #${id}? Hành động này KHÔNG THỂ hoàn tác.`)) return;
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/server", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setServers((prev) => prev.filter((s) => s.id !== id));
        if (detailServer?.id === id) setDetailServer(null);
        setActionSuccess(`Đã xóa server #${id}`);
      } else {
        alert("Xóa server thất bại.");
      }
    } finally {
      setUpdating(null);
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: servers.length,
      pending: servers.filter((s) => s.status === "pending").length,
      active: servers.filter((s) => s.status === "active").length,
      vipGold: servers.filter((s) => s.vipPackageType === "vip_gold").length,
      vipSilver: servers.filter((s) => s.vipPackageType === "vip_silver").length,
    };
  }, [servers]);

  // Filtered servers
  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      // Tab filter
      if (tabFilter === "pending" && s.status !== "pending") return false;
      if (tabFilter === "active" && s.status !== "active") return false;
      if (tabFilter === "vip" && s.vipPackageType === "none") return false;
      if (tabFilter === "rejected" && s.status !== "rejected" && s.status !== "archived") return false;

      // Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesVersion = s.version?.toLowerCase().includes(q);
        const matchesEmail = s.userEmail?.toLowerCase().includes(q);
        const matchesId = String(s.id).includes(q);
        if (!matchesName && !matchesVersion && !matchesEmail && !matchesId) return false;
      }

      return true;
    });
  }, [servers, tabFilter, search]);

  // Format date helper
  function formatDate(d?: string | number | null) {
    if (!d) return "Chưa đặt";
    try {
      return new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(d);
    }
  }

  // Render auth error state
  if (error === "forbidden") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/40 text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-red-200">Phiên đăng nhập không có quyền Admin</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          Tài khoản hiện tại của bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản quản trị viên.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/mu-admin/dang-nhap"
            className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-5 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-500/30 transition"
          >
            Đăng nhập Admin
          </Link>
          <button
            onClick={() => fetchServers()}
            className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-500/25 bg-gradient-to-r from-red-950/40 via-[#150a0a] to-black/60 p-5 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-red-900/40 to-black text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-amber-100 tracking-tight">Quản lý Server MU</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Hệ thống tự động duyệt server mới. Quản lý trạng thái, nâng VIP và xem chi tiết.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Approve All Pending Button */}
          {stats.pending > 0 && (
            <button
              onClick={approveAllPending}
              disabled={approvingAll}
              className="flex items-center gap-2 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-600/40 to-yellow-600/40 px-4 py-2 text-xs font-bold text-amber-100 hover:from-amber-600/60 hover:to-yellow-600/60 transition shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{approvingAll ? "Đang duyệt..." : `Duyệt tất cả (${stats.pending})`}</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={() => fetchServers()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-black/40 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-amber-500/40 hover:text-amber-200 transition disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Làm mới</span>
          </button>

          {/* Post server link */}
          <Link
            href="/dang-server"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Đăng server</span>
          </Link>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-medium text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Total */}
        <div className="rounded-2xl border border-amber-500/20 bg-black/40 p-4 transition hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tổng máy chủ</span>
            <Flag className="h-4 w-4 text-amber-400/80" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-100 tabular-nums">{stats.total}</p>
          <span className="text-[11px] text-zinc-500">Đã đăng lên web</span>
        </div>

        {/* Pending */}
        <div
          onClick={() => setTabFilter("pending")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            stats.pending > 0
              ? "border-amber-400/60 bg-amber-950/25 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:bg-amber-950/40"
              : "border-amber-500/20 bg-black/40 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Chờ duyệt</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-300 tabular-nums">{stats.pending}</p>
          <span className="text-[11px] text-amber-400/80">
            {stats.pending > 0 ? "⚡ Cần xử lý" : "Đã duyệt hết"}
          </span>
        </div>

        {/* Active */}
        <div
          onClick={() => setTabFilter("active")}
          className="cursor-pointer rounded-2xl border border-emerald-500/20 bg-black/40 p-4 transition hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Đang hoạt động</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-300 tabular-nums">{stats.active}</p>
          <span className="text-[11px] text-zinc-500">Hiển thị trang chủ</span>
        </div>

        {/* VIP Gold */}
        <div
          onClick={() => setTabFilter("vip")}
          className="cursor-pointer rounded-2xl border border-yellow-500/20 bg-black/40 p-4 transition hover:border-yellow-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-300">VIP Vàng</span>
            <Crown className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-yellow-300 tabular-nums">{stats.vipGold}</p>
          <span className="text-[11px] text-zinc-500">Vị trí hàng đầu</span>
        </div>

        {/* VIP Silver */}
        <div
          onClick={() => setTabFilter("vip")}
          className="cursor-pointer rounded-2xl border border-zinc-500/20 bg-black/40 p-4 transition hover:border-zinc-400/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">VIP Bạc</span>
            <Shield className="h-4 w-4 text-zinc-300" />
          </div>
          <p className="mt-2 text-2xl font-black text-zinc-200 tabular-nums">{stats.vipSilver}</p>
          <span className="text-[11px] text-zinc-500">Nổi bật</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-amber-500/20 bg-black/40 p-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: "all", label: "Tất cả", count: stats.total },
              { id: "pending", label: "Chờ duyệt", count: stats.pending, highlight: stats.pending > 0 },
              { id: "active", label: "Hoạt động", count: stats.active },
              { id: "vip", label: "Server VIP", count: stats.vipGold + stats.vipSilver },
              { id: "rejected", label: "Từ chối / Khác" },
            ] as const
          ).map((tab) => {
            const active = tabFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabFilter(tab.id as any)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border border-amber-500/50 bg-gradient-to-r from-amber-500/25 to-red-950/40 text-amber-100 shadow-sm"
                    : "border border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                {"count" in tab && tab.count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      tab.highlight
                        ? "bg-amber-400 text-black animate-pulse"
                        : active
                          ? "bg-amber-500/30 text-amber-200"
                          : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, phiên bản..."
            className="w-full rounded-xl border border-amber-500/20 bg-black/60 py-1.5 pl-9 pr-8 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-black/30 py-20 text-center">
          <RefreshCw className="h-7 w-7 text-amber-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-amber-200">Đang tải danh sách máy chủ...</p>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-black/30 py-16 text-center">
          <Flag className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-base font-bold text-zinc-300">Không tìm thấy máy chủ nào</p>
          <p className="mt-1 text-xs text-zinc-500">
            {search || tabFilter !== "all"
              ? "Thử thay đổi từ khóa tìm kiếm hoặc chuyển tab bộ lọc."
              : "Hiện tại chưa có máy chủ nào trong hệ thống."}
          </p>
          {(search || tabFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setTabFilter("all");
              }}
              className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-black/40 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-500/20 bg-[#120808]/90 text-zinc-400">
                  <th className="py-3.5 pl-4 pr-3 font-bold">ID / Máy chủ</th>
                  <th className="py-3.5 px-3 font-bold">Người đăng</th>
                  <th className="py-3.5 px-3 font-bold">Phiên bản / Exp</th>
                  <th className="py-3.5 px-3 font-bold">Alpha / Open Beta</th>
                  <th className="py-3.5 px-3 font-bold">Trạng thái</th>
                  <th className="py-3.5 px-3 font-bold">Gói VIP</th>
                  <th className="py-3.5 pl-3 pr-4 text-right font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {filteredServers.map((s) => {
                  const isUpdating = updating === s.id;
                  const isPending = s.status === "pending";

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        isPending ? "bg-amber-950/15" : ""
                      }`}
                    >
                      {/* Server ID & Name */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[11px] text-zinc-500 shrink-0 mt-0.5">
                            #{s.id}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-100 text-sm hover:text-amber-300">
                                {s.name}
                              </span>
                              {s.vipPackageType === "vip_gold" && (
                                <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-1 py-0.2 text-[9px] font-bold text-yellow-300 flex items-center gap-0.5">
                                  <Crown className="h-2.5 w-2.5" /> VIP
                                </span>
                              )}
                              {s.vipPackageType === "vip_silver" && (
                                <span className="rounded bg-zinc-700/40 border border-zinc-500/40 px-1 py-0.2 text-[9px] font-bold text-zinc-300 flex items-center gap-0.5">
                                  <Shield className="h-2.5 w-2.5" /> Bạc
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {s.websiteUrl && (
                                <a
                                  href={s.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-amber-400/80 hover:text-amber-300 truncate max-w-[180px]"
                                  title={s.websiteUrl}
                                >
                                  <Globe className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{s.websiteUrl.replace(/^https?:\/\//, "")}</span>
                                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User Email */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[160px]" title={s.userEmail || `User #${s.userId}`}>
                            {s.userEmail || `User #${s.userId}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          Tạo: {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>

                      {/* Version & EXP */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block font-semibold text-amber-200">
                          v{s.version}
                        </span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Exp: {s.exp} · Drop: {s.drop}
                        </p>
                      </td>

                      {/* Alpha / Open Beta Dates */}
                      <td className="py-3.5 px-3 text-zinc-300">
                        <div className="space-y-0.5 text-[11px]">
                          <div>
                            <span className="text-zinc-500 font-medium">Alpha: </span>
                            <span className="text-zinc-300 font-mono">{formatDate(s.alphaTestDate)}</span>
                          </div>
                          <div>
                            <span className="text-emerald-400/90 font-medium">Beta: </span>
                            <span className="text-amber-200 font-mono">{formatDate(s.openBetaDate)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3.5 px-3">
                        <select
                          value={s.status}
                          disabled={isUpdating}
                          onChange={(e) => updateServer(s.id, { status: e.target.value })}
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400/50 bg-black/60 ${
                            s.status === "active"
                              ? "border-emerald-600/50 text-emerald-300"
                              : s.status === "pending"
                                ? "border-amber-500/60 text-amber-300 animate-pulse"
                                : s.status === "rejected"
                                  ? "border-rose-600/50 text-rose-300"
                                  : "border-zinc-700 text-zinc-400"
                          }`}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[#120808] text-zinc-200">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* VIP Package Selector */}
                      <td className="py-3.5 px-3">
                        <select
                          value={s.vipPackageType}
                          disabled={isUpdating}
                          onChange={(e) => updateServer(s.id, { vipPackageType: e.target.value })}
                          className="rounded-lg border border-amber-500/30 bg-black/60 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/70 focus:outline-none"
                        >
                          <option value="none" className="bg-[#120808]">Không VIP</option>
                          <option value="vip_silver" className="bg-[#120808] text-zinc-200">VIP Bạc</option>
                          <option value="vip_gold" className="bg-[#120808] text-amber-300">VIP Vàng 👑</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If pending: Quick Approve / Reject buttons */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => updateServer(s.id, { status: "active" })}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-lg border border-emerald-600/60 bg-emerald-950/50 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition disabled:opacity-50"
                                title="Duyệt server ngay"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                onClick={() => updateServer(s.id, { status: "rejected" })}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-lg border border-rose-700/60 bg-rose-950/50 px-2 py-1 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition disabled:opacity-50"
                                title="Từ chối server"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => setDetailServer(s)}
                            className="flex items-center justify-center rounded-lg border border-zinc-700 bg-black/40 p-1.5 text-zinc-300 hover:border-amber-500/40 hover:text-amber-200 transition"
                            title="Xem chi tiết server"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteServer(s.id)}
                            disabled={isUpdating}
                            className="flex items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30 p-1.5 text-red-400 hover:border-red-700 hover:bg-red-900/50 transition disabled:opacity-50"
                            title="Xóa server vĩnh viễn"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-[#120808] p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-100 flex items-center gap-2">
                    {detailServer.name}
                    <span className="font-mono text-xs text-zinc-500">#{detailServer.id}</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Người đăng: {detailServer.userEmail || `ID #${detailServer.userId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailServer(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/40 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-amber-500/15 bg-black/40 p-2.5">
                  <span className="text-zinc-500">Phiên bản</span>
                  <p className="mt-1 font-bold text-amber-200 text-sm">v{detailServer.version}</p>
                </div>
                <div className="rounded-xl border border-amber-500/15 bg-black/40 p-2.5">
                  <span className="text-zinc-500">EXP / Drop</span>
                  <p className="mt-1 font-bold text-amber-200 text-sm">
                    {detailServer.exp} / {detailServer.drop}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/15 bg-black/40 p-2.5">
                  <span className="text-zinc-500">Trạng thái</span>
                  <p className="mt-1 font-bold capitalize text-emerald-300">{detailServer.status}</p>
                </div>
                <div className="rounded-xl border border-amber-500/15 bg-black/40 p-2.5">
                  <span className="text-zinc-500">Gói VIP</span>
                  <p className="mt-1 font-bold text-amber-300">{detailServer.vipPackageType}</p>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2 rounded-xl border border-amber-500/15 bg-black/30 p-3">
                <span className="font-bold text-amber-200">Đường dẫn liên kết:</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-zinc-500">Website: </span>
                    <a
                      href={detailServer.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      {detailServer.websiteUrl} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {detailServer.facebookUrl && (
                    <div>
                      <span className="text-zinc-500">Facebook: </span>
                      <a
                        href={detailServer.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        {detailServer.facebookUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {detailServer.zaloUrl && (
                    <div>
                      <span className="text-zinc-500">Zalo: </span>
                      <a
                        href={detailServer.zaloUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        {detailServer.zaloUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500">Slug: </span>
                    <span className="font-mono text-zinc-300">{detailServer.slug || "chưa tạo"}</span>
                  </div>
                </div>
              </div>

              {/* Introduction Content */}
              {detailServer.content && (
                <div className="space-y-1.5 rounded-xl border border-amber-500/15 bg-black/30 p-3">
                  <span className="font-bold text-amber-200">Bài viết giới thiệu:</span>
                  <div className="rounded bg-black/50 p-3 text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                    {detailServer.content}
                  </div>
                </div>
              )}

              {/* SEO Keywords */}
              {detailServer.seoKeywords && (
                <div>
                  <span className="text-zinc-500 block mb-1">Từ khóa SEO:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailServer.seoKeywords.split(",").map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-zinc-700 bg-black/40 px-2 py-0.5 text-[11px] text-zinc-300"
                      >
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-amber-500/20 pt-4">
              <button
                onClick={() => deleteServer(detailServer.id)}
                className="flex items-center gap-1 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/60 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa server</span>
              </button>

              <div className="flex items-center gap-2">
                {detailServer.status === "pending" && (
                  <button
                    onClick={() => updateServer(detailServer.id, { status: "active" })}
                    className="flex items-center gap-1 rounded-xl border border-emerald-600/60 bg-emerald-900/40 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-900/60 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Duyệt server</span>
                  </button>
                )}
                <button
                  onClick={() => setDetailServer(null)}
                  className="rounded-xl border border-zinc-700 bg-black/50 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

