"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type BannerRow = {
  id: number;
  userId: number;
  userEmail?: string | null;
  position: "center_top" | "left_sidebar" | "right_sidebar" | "center_mid" | "center_bottom" | string;
  imageUrl: string;
  targetUrl: string;
  status: "pending" | "active" | "expired" | "rejected" | string;
  startDate: string | number;
  endDate: string | number;
  createdAt: string;
  updatedAt?: string;
};

const POSITION_LABELS: Record<string, { label: string; specs: string; badgeColor: string }> = {
  center_top: { label: "Giữa lớn (Trang chủ)", specs: "780×280 px", badgeColor: "border-amber-500/50 bg-amber-500/15 text-amber-300" },
  center_mid: { label: "Giữa ngang (Danh sách)", specs: "780×110 px", badgeColor: "border-blue-500/50 bg-blue-500/15 text-blue-300" },
  left_sidebar: { label: "Cột sườn trái", specs: "204×390 px", badgeColor: "border-purple-500/50 bg-purple-500/15 text-purple-300" },
  right_sidebar: { label: "Cột sườn phải", specs: "204×390 px", badgeColor: "border-pink-500/50 bg-pink-500/15 text-pink-300" },
  center_bottom: { label: "Chân trang", specs: "780×110 px", badgeColor: "border-zinc-500/50 bg-zinc-500/15 text-zinc-300" },
};

function isMp4Url(url: string) {
  return /\.mp4(\?.*)?$/i.test(url);
}

function formatDateForInput(dateVal: string | number | undefined): string {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function BannerPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  // Modals
  const [preview, setPreview] = useState<BannerRow | null>(null);
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    position: "center_top",
    imageUrl: "",
    targetUrl: "",
    status: "active",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function fetchBanners() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banner", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { banners?: BannerRow[] };
      setBanners(data.banners ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBanners();
  }, []);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openCreateModal() {
    setFormData({
      position: "center_top",
      imageUrl: "",
      targetUrl: "https://",
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    setFormError("");
    setShowCreateModal(true);
  }

  function openEditModal(banner: BannerRow) {
    setEditingBanner(banner);
    setFormData({
      position: banner.position,
      imageUrl: banner.imageUrl,
      targetUrl: banner.targetUrl,
      status: banner.status,
      startDate: formatDateForInput(banner.startDate),
      endDate: formatDateForInput(banner.endDate),
    });
    setFormError("");
  }

  async function handleCreateBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.imageUrl.trim()) {
      setFormError("Vui lòng nhập link ảnh banner!");
      return;
    }
    if (!formData.targetUrl.trim()) {
      setFormError("Vui lòng nhập link website đích!");
      return;
    }

    setFormSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: formData.position,
          imageUrl: formData.imageUrl.trim(),
          targetUrl: formData.targetUrl.trim(),
          status: formData.status,
          startDate: new Date(formData.startDate).getTime(),
          endDate: new Date(formData.endDate).getTime(),
        }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setFormError(data.message || "Tạo banner thất bại");
        return;
      }

      setShowCreateModal(false);
      await fetchBanners();
    } catch {
      setFormError("Lỗi kết nối máy chủ");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleUpdateBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBanner) return;
    if (!formData.imageUrl.trim()) {
      setFormError("Vui lòng nhập link ảnh banner!");
      return;
    }
    if (!formData.targetUrl.trim()) {
      setFormError("Vui lòng nhập link website đích!");
      return;
    }

    setFormSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBanner.id,
          position: formData.position,
          imageUrl: formData.imageUrl.trim(),
          targetUrl: formData.targetUrl.trim(),
          status: formData.status,
          startDate: new Date(formData.startDate).getTime(),
          endDate: new Date(formData.endDate).getTime(),
        }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setFormError(data.message || "Cập nhật banner thất bại");
        return;
      }

      setEditingBanner(null);
      await fetchBanners();
    } catch {
      setFormError("Lỗi kết nối máy chủ");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      }
    } finally {
      setUpdating(null);
    }
  }

  async function deleteBanner(id: number) {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn banner #${id}?`)) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/banner?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } finally {
      setUpdating(null);
    }
  }

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (positionFilter !== "all" && b.position !== positionFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchUrl = b.targetUrl.toLowerCase().includes(q);
        const matchImage = b.imageUrl.toLowerCase().includes(q);
        const matchEmail = (b.userEmail ?? "").toLowerCase().includes(q);
        const matchId = String(b.id) === q;
        if (!matchUrl && !matchImage && !matchEmail && !matchId) return false;
      }
      return true;
    });
  }, [banners, statusFilter, positionFilter, search]);

  const stats = useMemo(() => {
    return {
      total: banners.length,
      active: banners.filter((b) => b.status === "active").length,
      pending: banners.filter((b) => b.status === "pending").length,
      expired: banners.filter((b) => b.status === "expired").length,
      rejected: banners.filter((b) => b.status === "rejected").length,
    };
  }, [banners]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-amber-100">Quản lý Banner Quảng Cáo</h1>
            <p className="text-xs text-zinc-400">
              Sửa trực tiếp Link ảnh, Link đích, Vị trí hiển thị và Thời hạn cho mọi banner.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchBanners()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-amber-500/40 hover:text-amber-200 transition disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500/30 via-red-950/40 to-amber-500/20 px-3.5 py-2 text-xs font-extrabold text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:brightness-125 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Banner Mới</span>
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-amber-500/20 bg-black/30 p-3">
          <span className="text-xs text-zinc-400">Tổng banner</span>
          <p className="mt-1 text-xl font-black text-amber-100">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
          <span className="text-xs text-emerald-400">Đang hoạt động</span>
          <p className="mt-1 text-xl font-black text-emerald-300">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-3">
          <span className="text-xs text-yellow-400">Chờ duyệt</span>
          <p className="mt-1 text-xl font-black text-yellow-300">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-black/30 p-3">
          <span className="text-xs text-zinc-400">Đã hết hạn</span>
          <p className="mt-1 text-xl font-black text-zinc-400">{stats.expired}</p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
          <span className="text-xs text-rose-400">Từ chối</span>
          <p className="mt-1 text-xl font-black text-rose-300">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-black/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo Link web, Link ảnh, Email người đăng, hoặc ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-amber-500/20 bg-black/60 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="rounded-xl border border-amber-500/20 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-amber-400/60 focus:outline-none"
          >
            <option value="all">Tất cả vị trí</option>
            <option value="center_top">Giữa lớn (780×280)</option>
            <option value="center_mid">Giữa ngang (780×110)</option>
            <option value="left_sidebar">Cột trái (204×390)</option>
            <option value="right_sidebar">Cột phải (204×390)</option>
            <option value="center_bottom">Chân trang</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-amber-500/20 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-amber-400/60 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động (Active)</option>
            <option value="pending">Chờ duyệt (Pending)</option>
            <option value="expired">Đã hết hạn (Expired)</option>
            <option value="rejected">Từ chối (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Banner List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin text-amber-400" />
          Đang tải danh sách banner...
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-500/25 bg-black/20 py-16 text-center text-zinc-500">
          <ImageIcon className="mx-auto h-10 w-10 opacity-40 mb-2" />
          <p className="text-sm">Không tìm thấy banner nào phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBanners.map((b) => {
            const pos = POSITION_LABELS[b.position] || {
              label: b.position,
              specs: "",
              badgeColor: "border-zinc-700 bg-zinc-800 text-zinc-300",
            };

            const isVideo = isMp4Url(b.imageUrl);
            const now = Date.now();
            const endMs = new Date(b.endDate).getTime();
            const isExpired = endMs < now;
            const daysLeft = Math.ceil((endMs - now) / 86400000);

            return (
              <div
                key={b.id}
                className="group relative flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-black/30 p-4 transition-all hover:border-amber-500/40 hover:bg-black/40 sm:flex-row sm:items-center"
              >
                {/* Media Thumbnail */}
                <div
                  className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-[#0d0505] cursor-pointer"
                  onClick={() => setPreview(b)}
                  title="Bấm để xem lớn"
                >
                  {isVideo ? (
                    <video
                      src={b.imageUrl}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.imageUrl}
                      alt={`Banner #${b.id}`}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Eye className="h-5 w-5 text-amber-200" />
                  </div>
                </div>

                {/* Banner Details */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">#{b.id}</span>

                    {/* Position Badge */}
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${pos.badgeColor}`}>
                      {pos.label} ({pos.specs})
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        b.status === "active"
                          ? "border-emerald-600/60 bg-emerald-950/50 text-emerald-300"
                          : b.status === "pending"
                            ? "border-yellow-600/60 bg-yellow-950/50 text-yellow-300 animate-pulse"
                            : b.status === "expired" || isExpired
                              ? "border-zinc-700 bg-zinc-900 text-zinc-400"
                              : "border-rose-700/60 bg-rose-950/50 text-rose-300"
                      }`}
                    >
                      {b.status}
                    </span>

                    {/* Expiry Badge */}
                    {b.status === "active" && (
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          daysLeft > 5
                            ? "bg-zinc-800 text-zinc-300"
                            : daysLeft > 0
                              ? "bg-amber-900/60 text-amber-200 border border-amber-500/40"
                              : "bg-rose-950 text-rose-300 border border-rose-600/40"
                        }`}
                      >
                        <Clock className="inline mr-1 h-2.5 w-2.5" />
                        {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Hết hạn"}
                      </span>
                    )}
                  </div>

                  {/* Target Link */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="shrink-0 text-zinc-500 font-medium">Link đích:</span>
                    <a
                      href={b.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 hover:underline truncate max-w-[320px] sm:max-w-md"
                      title={b.targetUrl}
                    >
                      <span className="truncate">{b.targetUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                    </a>
                    <button
                      onClick={() => copyToClipboard(b.targetUrl, `target-${b.id}`)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                      title="Sao chép link đích"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedId === `target-${b.id}` && (
                      <span className="text-[10px] text-emerald-400">Đã chép!</span>
                    )}
                  </div>

                  {/* Image Link */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="shrink-0 text-zinc-500 font-medium">Link ảnh:</span>
                    <span className="truncate max-w-[280px] sm:max-w-sm font-mono text-[11px] text-zinc-300" title={b.imageUrl}>
                      {b.imageUrl}
                    </span>
                    <button
                      onClick={() => copyToClipboard(b.imageUrl, `img-${b.id}`)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                      title="Sao chép link ảnh"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedId === `img-${b.id}` && (
                      <span className="text-[10px] text-emerald-400">Đã chép!</span>
                    )}
                  </div>

                  {/* Dates & User */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(b.startDate).toLocaleDateString("vi-VN")} → {new Date(b.endDate).toLocaleDateString("vi-VN")}
                    </span>
                    {b.userEmail && <span>Người đăng: {b.userEmail}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                  {/* EDIT BUTTON */}
                  <button
                    onClick={() => openEditModal(b)}
                    className="flex items-center gap-1 rounded-xl border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25 transition"
                    title="Chỉnh sửa Link ảnh, Link đích & Vị trí"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Sửa</span>
                  </button>

                  {/* View Preview */}
                  <button
                    onClick={() => setPreview(b)}
                    className="rounded-xl border border-zinc-700 bg-black/40 p-2 text-zinc-300 hover:border-amber-500/40 hover:text-amber-200 transition"
                    title="Xem trước banner"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {/* Quick Status Toggles */}
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, "active")}
                        disabled={updating === b.id}
                        className="rounded-xl border border-emerald-600/60 bg-emerald-950/40 p-2 text-emerald-300 hover:bg-emerald-900/60 transition disabled:opacity-50"
                        title="Duyệt banner"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "rejected")}
                        disabled={updating === b.id}
                        className="rounded-xl border border-rose-600/60 bg-rose-950/40 p-2 text-rose-300 hover:bg-rose-900/60 transition disabled:opacity-50"
                        title="Từ chối banner"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {b.status === "active" && (
                    <button
                      onClick={() => updateStatus(b.id, "expired")}
                      disabled={updating === b.id}
                      className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-2 text-zinc-400 hover:bg-zinc-800 transition disabled:opacity-50"
                      title="Đánh dấu hết hạn"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => deleteBanner(b.id)}
                    disabled={updating === b.id}
                    className="rounded-xl border border-red-900/50 bg-red-950/30 p-2 text-red-400 hover:border-red-700 hover:bg-red-900/50 transition disabled:opacity-50"
                    title="Xóa vĩnh viễn"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-[#120808] p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-base font-extrabold text-amber-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-400" />
                Thêm Banner Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-black/50 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Position */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Vị trí hiển thị <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="center_top">Giữa lớn trên cùng (780×280 px)</option>
                  <option value="center_mid">Giữa ngang danh sách (780×110 px)</option>
                  <option value="left_sidebar">Cột sườn trái (204×390 px)</option>
                  <option value="right_sidebar">Cột sườn phải (204×390 px)</option>
                  <option value="center_bottom">Chân trang (780×110 px)</option>
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Link Ảnh / Video Banner <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://... (JPG, PNG, GIF, WebP hoặc MP4)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Live Preview */}
              {formData.imageUrl.trim() && (
                <div className="rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-1">Xem trước ảnh:</span>
                  <div className="max-h-48 overflow-hidden rounded-lg bg-black/80 flex items-center justify-center p-1">
                    {isMp4Url(formData.imageUrl) ? (
                      <video src={formData.imageUrl} className="max-h-44 object-contain" autoPlay muted loop />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.imageUrl} alt="Preview" className="max-h-44 object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* Target URL */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Link Website Đích (Khi click vào banner) <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://server-mu.com"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    className="flex-1 rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                  {formData.targetUrl.trim() && (
                    <a
                      href={formData.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-zinc-300 hover:text-amber-200 transition"
                      title="Mở thử link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Thử</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Date Range & Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="expired">Hết hạn (Expired)</option>
                    <option value="rejected">Từ chối (Rejected)</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-amber-500/20 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500 via-amber-600 to-red-700 px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition disabled:opacity-50"
                >
                  {formSubmitting ? "Đang lưu..." : "Thêm Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-[#120808] p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-base font-extrabold text-amber-100 flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-400" />
                Chỉnh Sửa Banner #{editingBanner.id}
              </h3>
              <button
                onClick={() => setEditingBanner(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-black/50 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBanner} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Position */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Vị trí hiển thị <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="center_top">Giữa lớn trên cùng (780×280 px)</option>
                  <option value="center_mid">Giữa ngang danh sách (780×110 px)</option>
                  <option value="left_sidebar">Cột sườn trái (204×390 px)</option>
                  <option value="right_sidebar">Cột sườn phải (204×390 px)</option>
                  <option value="center_bottom">Chân trang (780×110 px)</option>
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Link Ảnh / Video Banner <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://... (JPG, PNG, GIF, WebP hoặc MP4)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Live Preview */}
              {formData.imageUrl.trim() && (
                <div className="rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-1">Xem trước ảnh cập nhật:</span>
                  <div className="max-h-48 overflow-hidden rounded-lg bg-black/80 flex items-center justify-center p-1">
                    {isMp4Url(formData.imageUrl) ? (
                      <video src={formData.imageUrl} className="max-h-44 object-contain" autoPlay muted loop />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.imageUrl} alt="Preview" className="max-h-44 object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* Target URL */}
              <div>
                <label className="mb-1.5 block font-bold text-amber-200">
                  Link Website Đích (Khi click vào banner) <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://server-mu.com"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    className="flex-1 rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                  {formData.targetUrl.trim() && (
                    <a
                      href={formData.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-zinc-300 hover:text-amber-200 transition"
                      title="Mở thử link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Thử</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Date Range & Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-zinc-300">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="expired">Hết hạn (Expired)</option>
                    <option value="rejected">Từ chối (Rejected)</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-amber-500/20 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500 via-amber-600 to-red-700 px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition disabled:opacity-50"
                >
                  {formSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl border border-amber-500/40 bg-[#120808] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-100">Xem trước Banner #{preview.id}</h3>
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/40 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <a href={preview.targetUrl} target="_blank" rel="noopener noreferrer">
              {isMp4Url(preview.imageUrl) ? (
                <video src={preview.imageUrl} className="max-h-[420px] w-full rounded-lg border border-amber-500/20 object-contain" autoPlay muted loop playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.imageUrl}
                  alt={`Banner ${preview.id}`}
                  className="max-h-[420px] w-full rounded-lg border border-amber-500/20 object-contain"
                />
              )}
            </a>
            <div className="mt-4 space-y-1 text-xs text-zinc-400">
              <p>Vị trí: <strong className="text-amber-200">{preview.position}</strong></p>
              <p>Link đích: <a href={preview.targetUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">{preview.targetUrl}</a></p>
              <p>Link ảnh: <span className="font-mono text-zinc-300">{preview.imageUrl}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
