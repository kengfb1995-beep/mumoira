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
  Copy,
  Crown,
  Edit,
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
  const [tabFilter, setTabFilter] = useState<"all" | "pending" | "active" | "vip" | "vip_gold" | "rejected">("all");

  // Detail Modal
  const [detailServer, setDetailServer] = useState<ServerRow | null>(null);

  // Edit Server Modal
  const [editServer, setEditServer] = useState<ServerRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    websiteUrl: "",
    bannerUrl: "",
    vipPackageType: "none",
    status: "active",
    version: "Season 6",
    exp: "x9999",
    drop: "50%",
    facebookUrl: "",
    zaloUrl: "",
    openBetaDate: "",
    alphaTestDate: "",
    content: "",
    seoKeywords: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Create Server Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    websiteUrl: "",
    bannerUrl: "",
    vipPackageType: "vip_gold",
    status: "active",
    version: "Season 6",
    exp: "x9999",
    drop: "50%",
    facebookUrl: "",
    zaloUrl: "",
    openBetaDate: "",
    alphaTestDate: "",
    content: "",
    seoKeywords: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

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

  function formatDateInput(d?: string | number | null) {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }

  function openEditModal(s: ServerRow) {
    setEditServer(s);
    setEditForm({
      name: s.name,
      websiteUrl: s.websiteUrl,
      bannerUrl: s.bannerUrl || "",
      vipPackageType: s.vipPackageType,
      status: s.status,
      version: s.version,
      exp: s.exp,
      drop: s.drop,
      facebookUrl: s.facebookUrl || "",
      zaloUrl: s.zaloUrl || "",
      openBetaDate: formatDateInput(s.openBetaDate),
      alphaTestDate: formatDateInput(s.alphaTestDate),
      content: s.content || "",
      seoKeywords: s.seoKeywords || "",
    });
    setEditError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editServer) return;
    if (!editForm.name.trim()) {
      setEditError("Vui lòng nhập tên server!");
      return;
    }
    if (!editForm.websiteUrl.trim()) {
      setEditError("Vui lòng nhập link website!");
      return;
    }

    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch("/api/admin/server", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editServer.id,
          name: editForm.name.trim(),
          websiteUrl: editForm.websiteUrl.trim(),
          bannerUrl: editForm.bannerUrl.trim() || null,
          vipPackageType: editForm.vipPackageType,
          status: editForm.status,
          version: editForm.version.trim(),
          exp: editForm.exp.trim(),
          drop: editForm.drop.trim(),
          facebookUrl: editForm.facebookUrl.trim() || null,
          zaloUrl: editForm.zaloUrl.trim() || null,
          openBetaDate: editForm.openBetaDate ? new Date(editForm.openBetaDate).getTime() : null,
          alphaTestDate: editForm.alphaTestDate ? new Date(editForm.alphaTestDate).getTime() : null,
          content: editForm.content,
          seoKeywords: editForm.seoKeywords,
        }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setEditError(data.message || "Cập nhật server thất bại");
        return;
      }

      setEditServer(null);
      setActionSuccess(`Đã lưu thành công server #${editServer.id}!`);
      await fetchServers();
    } catch {
      setEditError("Lỗi kết nối máy chủ");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSaveCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError("Vui lòng nhập tên server!");
      return;
    }
    if (!createForm.websiteUrl.trim()) {
      setCreateError("Vui lòng nhập link website!");
      return;
    }

    setCreateSubmitting(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          websiteUrl: createForm.websiteUrl.trim(),
          bannerUrl: createForm.bannerUrl.trim() || null,
          vipPackageType: createForm.vipPackageType,
          status: createForm.status,
          version: createForm.version.trim(),
          exp: createForm.exp.trim(),
          drop: createForm.drop.trim(),
          facebookUrl: createForm.facebookUrl.trim() || null,
          zaloUrl: createForm.zaloUrl.trim() || null,
          openBetaDate: createForm.openBetaDate ? new Date(createForm.openBetaDate).getTime() : null,
          alphaTestDate: createForm.alphaTestDate ? new Date(createForm.alphaTestDate).getTime() : null,
          content: createForm.content,
          seoKeywords: createForm.seoKeywords,
        }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setCreateError(data.message || "Tạo server thất bại");
        return;
      }

      setShowCreateModal(false);
      setActionSuccess("Đã thêm server mới thành công!");
      await fetchServers();
    } catch {
      setCreateError("Lỗi kết nối máy chủ");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function updateServer(id: number, patch: Partial<ServerRow>) {
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
      if (tabFilter === "vip_gold" && s.vipPackageType !== "vip_gold") return false;
      if (tabFilter === "vip" && s.vipPackageType === "none") return false;
      if (tabFilter === "rejected" && s.status !== "rejected" && s.status !== "archived") return false;

      // Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesVersion = s.version?.toLowerCase().includes(q);
        const matchesEmail = s.userEmail?.toLowerCase().includes(q);
        const matchesWeb = s.websiteUrl?.toLowerCase().includes(q);
        const matchesId = String(s.id).includes(q);
        if (!matchesName && !matchesVersion && !matchesEmail && !matchesWeb && !matchesId) return false;
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

          {/* Add server button */}
          <button
            onClick={() => {
              setCreateForm({
                name: "",
                websiteUrl: "",
                bannerUrl: "",
                vipPackageType: "vip_gold",
                status: "active",
                version: "Season 6",
                exp: "x9999",
                drop: "50%",
                facebookUrl: "",
                zaloUrl: "",
                openBetaDate: "",
                alphaTestDate: "",
                content: "",
                seoKeywords: "",
              });
              setCreateError("");
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500/30 via-red-950/40 to-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:brightness-125 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm Server Mới</span>
          </button>

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
          onClick={() => setTabFilter("vip_gold")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            tabFilter === "vip_gold"
              ? "border-yellow-400 bg-yellow-950/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              : "border-yellow-500/30 bg-black/40 hover:border-yellow-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-300">VIP Vàng 👑</span>
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
          {[
            { id: "all" as const, label: "Tất cả", count: stats.total, highlight: false },
            { id: "pending" as const, label: "Chờ duyệt", count: stats.pending, highlight: stats.pending > 0 },
            { id: "vip_gold" as const, label: "👑 VIP Vàng", count: stats.vipGold, highlight: false },
            { id: "vip" as const, label: "VIP (Tất cả)", count: stats.vipGold + stats.vipSilver, highlight: false },
            { id: "active" as const, label: "Hoạt động", count: stats.active, highlight: false },
            { id: "rejected" as const, label: "Từ chối / Khác", count: undefined, highlight: false },
          ].map((tab) => {
            const active = tabFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabFilter(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border border-amber-500/50 bg-gradient-to-r from-amber-500/25 to-red-950/40 text-amber-100 shadow-sm"
                    : "border border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
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

                            {/* VIP Vàng Banner preview in table */}
                            {s.vipPackageType === "vip_gold" && (
                              <div className="mt-2">
                                {s.bannerUrl ? (
                                  <div
                                    className="relative h-7 w-28 overflow-hidden rounded border border-amber-500/50 bg-black/60 shadow-sm cursor-pointer hover:border-amber-400"
                                    onClick={() => openEditModal(s)}
                                    title="Ảnh banner VIP Vàng 468×68 (Bấm để sửa link ảnh)"
                                  >
                                    <img
                                      src={s.bannerUrl}
                                      alt="Banner VIP"
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => openEditModal(s)}
                                    className="inline-flex items-center gap-1 rounded border border-dashed border-amber-500/40 bg-amber-950/20 px-2 py-0.5 text-[10px] text-amber-300 hover:bg-amber-900/30"
                                    title="Chưa có link ảnh banner VIP Vàng - Bấm để thêm"
                                  >
                                    <Plus className="h-2.5 w-2.5" />
                                    <span>Thêm banner 468×68</span>
                                  </button>
                                )}
                              </div>
                            )}
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

                          {/* Edit Server Button */}
                          <button
                            onClick={() => openEditModal(s)}
                            className="flex items-center justify-center rounded-lg border border-amber-500/50 bg-amber-500/20 p-1.5 text-amber-200 hover:bg-amber-500/35 transition"
                            title="Sửa Link Website, Banner VIP Vàng & Thông tin Server"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

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
                <button
                  onClick={() => {
                    const s = detailServer;
                    setDetailServer(null);
                    openEditModal(s);
                  }}
                  className="flex items-center gap-1 rounded-xl border border-amber-500/60 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Sửa Server / VIP</span>
                </button>

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

      {/* EDIT SERVER & VIP MODAL */}
      {editServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-[#120808] p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-amber-100 flex items-center gap-2">
                    Sửa Server #{editServer.id}
                    {editForm.vipPackageType === "vip_gold" && (
                      <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-1.5 py-0.2 text-[10px] font-bold text-yellow-300">
                        👑 VIP Vàng
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Chỉnh sửa Link Website, Banner VIP Vàng, Gói VIP và thông tin hiển thị.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditServer(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/50 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              {editError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Row 1: Name & VIP Package */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-bold text-amber-200">
                    Tên Server <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="MU Sài Gòn, MU Hà Nội..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-amber-200">
                    Gói VIP hiển thị
                  </label>
                  <select
                    value={editForm.vipPackageType}
                    onChange={(e) => setEditForm({ ...editForm, vipPackageType: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="vip_gold" className="bg-[#120808] text-amber-300 font-bold">VIP Vàng 👑 (Có banner 468×68 & Vị trí top)</option>
                    <option value="vip_silver" className="bg-[#120808] text-zinc-200">VIP Bạc 🛡️ (Nổi bật)</option>
                    <option value="none" className="bg-[#120808] text-zinc-400">Không VIP (Miễn phí)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Website URL */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Link Website Server (Trang chủ / Đăng ký) <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.websiteUrl}
                    onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                    className="flex-1 rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="https://mumoira.net"
                  />
                  {editForm.websiteUrl.trim() && (
                    <a
                      href={editForm.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-zinc-300 hover:text-amber-200 transition"
                      title="Mở thử link web"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Thử</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Row 3: Banner URL VIP Vàng (468x68) */}
              <div className="rounded-xl border border-amber-500/25 bg-black/30 p-3 space-y-2">
                <label className="block font-bold text-amber-300">
                  Link Ảnh Banner VIP Vàng (Kích thước khuyến nghị: 468×68 px)
                </label>
                <input
                  type="text"
                  value={editForm.bannerUrl}
                  onChange={(e) => setEditForm({ ...editForm, bannerUrl: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  placeholder="https://... ảnh banner ngang (JPG, PNG, GIF, WebP)"
                />

                {/* Live 468x68 Preview */}
                {editForm.bannerUrl.trim() ? (
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">Xem trước khung hiển thị banner VIP Vàng (468×68):</span>
                    <div className="relative w-full max-w-[468px] h-[68px] overflow-hidden rounded border border-amber-500/50 bg-[#0d0505] shadow-md flex items-center justify-center">
                      <img
                        src={editForm.bannerUrl}
                        alt="VIP Banner Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">
                    Server VIP Vàng sẽ hiển thị banner ngang 468×68 trên trang chủ. Nếu để trống sẽ hiển thị khung placeholder.
                  </p>
                )}
              </div>

              {/* Row 4: Status & Version & EXP/Drop */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="rejected">Từ chối (Rejected)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Phiên bản</label>
                  <input
                    type="text"
                    value={editForm.version}
                    onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="Season 6"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">EXP</label>
                  <input
                    type="text"
                    value={editForm.exp}
                    onChange={(e) => setEditForm({ ...editForm, exp: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="x9999"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Drop</label>
                  <input
                    type="text"
                    value={editForm.drop}
                    onChange={(e) => setEditForm({ ...editForm, drop: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="50%"
                  />
                </div>
              </div>

              {/* Row 5: Zalo & Facebook */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Link / SĐT Zalo</label>
                  <input
                    type="text"
                    value={editForm.zaloUrl}
                    onChange={(e) => setEditForm({ ...editForm, zaloUrl: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="https://zalo.me/... hoặc SĐT"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Link Fanpage / Group FB</label>
                  <input
                    type="text"
                    value={editForm.facebookUrl}
                    onChange={(e) => setEditForm({ ...editForm, facebookUrl: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              {/* Row 6: Dates */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Ngày Alpha Test</label>
                  <input
                    type="datetime-local"
                    value={editForm.alphaTestDate}
                    onChange={(e) => setEditForm({ ...editForm, alphaTestDate: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Ngày Open Beta</label>
                  <input
                    type="datetime-local"
                    value={editForm.openBetaDate}
                    onChange={(e) => setEditForm({ ...editForm, openBetaDate: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 7: SEO Keywords */}
              <div>
                <label className="mb-1 block font-bold text-zinc-300">Từ khóa SEO (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={editForm.seoKeywords}
                  onChange={(e) => setEditForm({ ...editForm, seoKeywords: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  placeholder="mu moi ra, mu season 6, mu open hom nay..."
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-amber-500/20 pt-3.5">
                <button
                  type="button"
                  onClick={() => setEditServer(null)}
                  className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500 via-amber-600 to-red-700 px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition disabled:opacity-50"
                >
                  {editSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SERVER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-[#120808] p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-amber-100 flex items-center gap-2">
                    Thêm Server Mới / Gán VIP Vàng
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Tạo trực tiếp máy chủ và gắn gói VIP Vàng kèm ảnh banner 468×68.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/50 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4 pt-4 text-xs">
              {createError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Row 1: Name & VIP Package */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-bold text-amber-200">
                    Tên Server <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="MU Sài Gòn, MU Hà Nội..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-amber-200">
                    Gói VIP hiển thị
                  </label>
                  <select
                    value={createForm.vipPackageType}
                    onChange={(e) => setCreateForm({ ...createForm, vipPackageType: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="vip_gold" className="bg-[#120808] text-amber-300 font-bold">VIP Vàng 👑 (Có banner 468×68 & Vị trí top)</option>
                    <option value="vip_silver" className="bg-[#120808] text-zinc-200">VIP Bạc 🛡️ (Nổi bật)</option>
                    <option value="none" className="bg-[#120808] text-zinc-400">Không VIP (Miễn phí)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Website URL */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Link Website Server (Trang chủ / Đăng ký) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.websiteUrl}
                  onChange={(e) => setCreateForm({ ...createForm, websiteUrl: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  placeholder="https://mumoira.net"
                />
              </div>

              {/* Row 3: Banner URL VIP Vàng (468x68) */}
              <div className="rounded-xl border border-amber-500/25 bg-black/30 p-3 space-y-2">
                <label className="block font-bold text-amber-300">
                  Link Ảnh Banner VIP Vàng (Kích thước khuyến nghị: 468×68 px)
                </label>
                <input
                  type="text"
                  value={createForm.bannerUrl}
                  onChange={(e) => setCreateForm({ ...createForm, bannerUrl: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  placeholder="https://... ảnh banner ngang (JPG, PNG, GIF, WebP)"
                />

                {/* Live 468x68 Preview */}
                {createForm.bannerUrl.trim() && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">Xem trước khung hiển thị banner VIP Vàng (468×68):</span>
                    <div className="relative w-full max-w-[468px] h-[68px] overflow-hidden rounded border border-amber-500/50 bg-[#0d0505] shadow-md flex items-center justify-center">
                      <img
                        src={createForm.bannerUrl}
                        alt="VIP Banner Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Status & Version & EXP/Drop */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Trạng thái</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="rejected">Từ chối (Rejected)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Phiên bản</label>
                  <input
                    type="text"
                    value={createForm.version}
                    onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="Season 6"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">EXP</label>
                  <input
                    type="text"
                    value={createForm.exp}
                    onChange={(e) => setCreateForm({ ...createForm, exp: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="x9999"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Drop</label>
                  <input
                    type="text"
                    value={createForm.drop}
                    onChange={(e) => setCreateForm({ ...createForm, drop: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="50%"
                  />
                </div>
              </div>

              {/* Row 5: Zalo & Facebook */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Link / SĐT Zalo</label>
                  <input
                    type="text"
                    value={createForm.zaloUrl}
                    onChange={(e) => setCreateForm({ ...createForm, zaloUrl: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="https://zalo.me/... hoặc SĐT"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Link Fanpage / Group FB</label>
                  <input
                    type="text"
                    value={createForm.facebookUrl}
                    onChange={(e) => setCreateForm({ ...createForm, facebookUrl: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-amber-500/20 pt-3.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500 via-amber-600 to-red-700 px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition disabled:opacity-50"
                >
                  {createSubmitting ? "Đang lưu..." : "Tạo Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

