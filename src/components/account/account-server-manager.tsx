"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Globe,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Server as ServerIcon,
  X,
} from "lucide-react";
import { useUi } from "@/components/providers/ui-provider";
import { formatDateTimeShortVietnam, toDatetimeLocalValueVn } from "@/lib/vn-datetime";

export type AccountServerItem = {
  id: number;
  name: string;
  status: string;
  vipPackageType: string;
  openBetaDate: Date | number | null;
  alphaTestDate: Date | number | null;
  websiteUrl: string;
  bannerUrl: string | null;
  facebookUrl: string | null;
  zaloUrl: string | null;
  version: string;
  exp: string;
  drop: string;
  content: string;
  seoKeywords: string;
  slug: string;
  createdAt: Date | number | null;
};

export function AccountServerManager({
  initialServers,
}: {
  initialServers: AccountServerItem[];
}) {
  const { notify } = useUi();
  const [serversList, setServersList] = useState<AccountServerItem[]>(initialServers);
  const [editingServer, setEditingServer] = useState<AccountServerItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: "",
    websiteUrl: "",
    bannerUrl: "",
    openBetaDate: "",
    alphaTestDate: "",
    version: "",
    exp: "",
    drop: "",
    facebookUrl: "",
    zaloUrl: "",
    content: "",
    seoKeywords: "",
  });

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
    notify({ type: "info", title: "Đã sao chép vào bộ nhớ tạm" });
  }

  function openEditModal(srv: AccountServerItem) {
    setEditingServer(srv);
    setEditForm({
      name: srv.name || "",
      websiteUrl: srv.websiteUrl || "",
      bannerUrl: srv.bannerUrl || "",
      openBetaDate: toDatetimeLocalValueVn(srv.openBetaDate),
      alphaTestDate: toDatetimeLocalValueVn(srv.alphaTestDate),
      version: srv.version || "",
      exp: srv.exp || "",
      drop: srv.drop || "",
      facebookUrl: srv.facebookUrl || "",
      zaloUrl: srv.zaloUrl || "",
      content: srv.content || "",
      seoKeywords: srv.seoKeywords || "",
    });
  }

  async function handleSaveServer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingServer || saving) return;

    if (!editForm.websiteUrl.trim() || !/^https?:\/\/.+/.test(editForm.websiteUrl.trim())) {
      notify({ type: "error", title: "Website URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)" });
      return;
    }

    if (editForm.bannerUrl.trim() && !/^https?:\/\/.+/.test(editForm.bannerUrl.trim())) {
      notify({ type: "error", title: "Link banner không hợp lệ (cần bắt đầu bằng http:// hoặc https://)" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/servers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingServer.id,
          name: editForm.name,
          websiteUrl: editForm.websiteUrl,
          bannerUrl: editForm.bannerUrl.trim() || null,
          openBetaDate: editForm.openBetaDate || undefined,
          alphaTestDate: editForm.alphaTestDate || undefined,
          version: editForm.version,
          exp: editForm.exp,
          drop: editForm.drop,
          facebookUrl: editForm.facebookUrl || null,
          zaloUrl: editForm.zaloUrl || null,
          content: editForm.content,
          seoKeywords: editForm.seoKeywords,
        }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        notify({ type: "error", title: data.message ?? "Cập nhật server thất bại" });
        setSaving(false);
        return;
      }

      notify({ type: "success", title: "Cập nhật thông tin server thành công!" });

      // Cập nhật lại danh sách local
      setServersList((prev) =>
        prev.map((item) =>
          item.id === editingServer.id
            ? {
                ...item,
                name: editForm.name,
                websiteUrl: editForm.websiteUrl,
                bannerUrl: editForm.bannerUrl.trim() || null,
                openBetaDate: editForm.openBetaDate ? new Date(editForm.openBetaDate) : item.openBetaDate,
                alphaTestDate: editForm.alphaTestDate ? new Date(editForm.alphaTestDate) : item.alphaTestDate,
                version: editForm.version,
                exp: editForm.exp,
                drop: editForm.drop,
                facebookUrl: editForm.facebookUrl || null,
                zaloUrl: editForm.zaloUrl || null,
                content: editForm.content,
                seoKeywords: editForm.seoKeywords,
              }
            : item,
        ),
      );

      setEditingServer(null);
    } catch {
      notify({ type: "error", title: "Có lỗi xảy ra khi kết nối máy chủ" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header action */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-amber-200 sm:text-xl">Danh sách máy chủ của bạn</h2>
          <p className="text-xs text-zinc-400">
            Bạn có thể chỉnh sửa lại link website, link ảnh banner VIP Vàng (468x68), ngày Open/Alpha test bất cứ lúc nào nếu nhập sai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dang-server"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600/30 to-amber-700/30 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:border-amber-400 hover:text-amber-100"
          >
            <Plus className="h-4 w-4" />
            Đăng Server Mới
          </Link>
          <Link
            href="/tai-khoan/mua-dich-vu"
            className="inline-flex items-center gap-1.5 rounded-xl border border-yellow-500/50 bg-yellow-500/20 px-3 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-500/30"
          >
            <Crown className="h-4 w-4" />
            Nâng Cấp VIP Vàng
          </Link>
        </div>
      </div>

      {serversList.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/20 bg-black/25 p-8 text-center">
          <ServerIcon className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <p className="font-semibold text-amber-100">Bạn chưa đăng máy chủ nào</p>
          <p className="mt-1 text-xs text-zinc-400">
            Hãy bắt đầu đăng máy chủ MU của bạn để tiếp cận hàng ngàn game thủ đam mê MU Online!
          </p>
          <div className="mt-4">
            <Link
              href="/dang-server"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/60 bg-amber-600/20 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-600/30"
            >
              <Plus className="h-4 w-4" />
              Đăng Server Ngay (5.000đ)
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {serversList.map((srv) => {
            const isVipGold = srv.vipPackageType === "vip_gold";
            const isVipSilver = srv.vipPackageType === "vip_silver";

            return (
              <div
                key={srv.id}
                className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all ${
                  isVipGold
                    ? "border-amber-500/50 bg-gradient-to-b from-amber-950/25 via-black/40 to-black/60 shadow-[0_0_25px_-5px_rgba(245,158,11,0.15)]"
                    : "border-amber-500/20 bg-black/30 hover:border-amber-500/40"
                }`}
              >
                {/* Top badges & server name */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-amber-100 sm:text-lg">{srv.name}</span>
                      {isVipGold && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500/30 to-yellow-600/30 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-200 shadow-sm">
                          <Crown className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                          VIP VÀNG
                        </span>
                      )}
                      {isVipSilver && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-400/60 bg-zinc-800/60 px-2.5 py-0.5 text-[11px] font-bold text-zinc-200">
                          VIP BẠC
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          srv.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : srv.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {srv.status === "active"
                          ? "Đang hiển thị"
                          : srv.status === "pending"
                            ? "Chờ duyệt"
                            : srv.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Season: <span className="text-zinc-200 font-medium">{srv.version || "N/A"}</span> · Exp:{" "}
                      <span className="text-zinc-200 font-medium">{srv.exp || "N/A"}</span> · Drop:{" "}
                      <span className="text-zinc-200 font-medium">{srv.drop || "N/A"}</span>
                    </p>
                  </div>

                  {/* Edit action button */}
                  <button
                    onClick={() => openEditModal(srv)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-600/30 hover:border-amber-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa Thông Tin & VIP
                  </button>
                </div>

                {/* Website URL bar */}
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/20 bg-black/40 px-3 py-2 text-xs">
                  <Globe className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-zinc-400 font-medium">Website:</span>
                  <span className="font-mono text-zinc-200 truncate max-w-[280px] sm:max-w-[400px]">
                    {srv.websiteUrl}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <a
                      href={srv.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-500/20 transition"
                      title="Mở website trong tab mới"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Mở Web
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(srv.websiteUrl, `web-${srv.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition"
                    >
                      {copiedKey === `web-${srv.id}` ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                </div>

                {/* VIP Vàng Banner Preview */}
                <div className="mb-3 rounded-xl border border-amber-500/20 bg-black/40 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-200">Banner VIP Vàng (468×68 px)</span>
                      {isVipGold && (
                        <span className="text-[10px] text-amber-400/90 font-medium">(Đang hiển thị ngoài trang chủ)</span>
                      )}
                    </div>
                    {srv.bannerUrl && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(srv.bannerUrl!, `banner-${srv.id}`)}
                        className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-amber-300"
                      >
                        {copiedKey === `banner-${srv.id}` ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy link ảnh
                      </button>
                    )}
                  </div>

                  {srv.bannerUrl ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative overflow-hidden rounded border border-amber-500/40 bg-zinc-950 p-0.5 shadow-sm max-w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={srv.bannerUrl}
                          alt={`Banner ${srv.name}`}
                          className="h-[54px] sm:h-[68px] w-auto max-w-[468px] object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/468x68/1a1a1a/eab308?text=Loi+Link+Anh+VIP";
                          }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400 space-y-1">
                        <p className="truncate max-w-[280px] font-mono text-[11px] text-zinc-500">{srv.bannerUrl}</p>
                        <button
                          type="button"
                          onClick={() => openEditModal(srv)}
                          className="text-[11px] font-medium text-amber-400 hover:underline"
                        >
                          Đổi ảnh banner khác
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-zinc-400">
                      <span>
                        Chưa có banner 468×68.{" "}
                        {isVipGold ? (
                          <span className="text-amber-300 font-semibold">
                            (Máy chủ đang có gói VIP Vàng, hãy cập nhật ảnh banner để hiển thị chuẩn nhất!)
                          </span>
                        ) : (
                          "Cần nâng cấp VIP Vàng để hiển thị banner tại vị trí VIP đầu trang."
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(srv)}
                        className="rounded-lg border border-amber-500/50 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
                      >
                        + Thêm link ảnh
                      </button>
                    </div>
                  )}
                </div>

                {/* Dates & Quick view */}
                <div className="grid gap-2 sm:grid-cols-2 text-xs border-t border-zinc-800/80 pt-3 text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-400/80" />
                    <span>Alpha Test:</span>
                    <span className="font-semibold text-zinc-200">
                      {formatDateTimeShortVietnam(srv.alphaTestDate ? new Date(srv.alphaTestDate) : null) ||
                        "Chưa thiết lập"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-400/80" />
                    <span>Open Beta:</span>
                    <span className="font-semibold text-zinc-200">
                      {formatDateTimeShortVietnam(srv.openBetaDate ? new Date(srv.openBetaDate) : null) ||
                        "Chưa thiết lập"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CHỈNH SỬA SERVER & VIP */}
      {editingServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <h3 className="text-base font-bold text-amber-200 sm:text-lg flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-amber-400" />
                  Sửa Thông Tin Máy Chủ & VIP
                </h3>
                <p className="text-xs text-zinc-400">
                  Cập nhật lại link website, ảnh banner VIP Vàng hoặc thông tin server nếu bạn lỡ nhập sai
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingServer(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveServer} className="space-y-4 text-xs">
              {/* Tên server */}
              <div className="space-y-1">
                <label className="font-semibold text-amber-100">
                  Tên máy chủ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="Ví dụ: MU Hà Nội Season 6..."
                />
              </div>

              {/* Website Máy Chủ */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-100 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-amber-400" />
                    Website Máy Chủ <span className="text-red-400">*</span>
                  </label>
                  {editForm.websiteUrl && (
                    <a
                      href={editForm.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Test link
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  required
                  value={editForm.websiteUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="https://mu-domain.com"
                />
                <p className="text-[11px] text-zinc-500">
                  Người chơi sẽ được chuyển thẳng đến website này khi bấm vào nút hoặc banner của máy chủ.
                </p>
              </div>

              {/* Link Banner VIP Vàng (468x68) */}
              <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    Link Banner VIP Vàng (468×68 px)
                  </label>
                  {editForm.bannerUrl && (
                    <a
                      href={editForm.bannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Xem ảnh gốc
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={editForm.bannerUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="https://domain.com/banner-468x68.gif"
                />
                <p className="text-[11px] text-zinc-400">
                  Tỉ lệ chuẩn 468×68 px. Hỗ trợ ảnh tĩnh (.jpg, .png, .webp) hoặc ảnh động (.gif).
                </p>

                {/* Live Preview 468x68 */}
                {editForm.bannerUrl ? (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-400">Xem trước trực tiếp (Live Preview):</span>
                    <div className="flex justify-center rounded border border-amber-500/40 bg-zinc-950 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editForm.bannerUrl}
                        alt="Xem trước banner 468x68"
                        className="h-[68px] w-auto max-w-[468px] object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/468x68/1a1a1a/eab308?text=Link+Anh+Khong+Hop+Le";
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Alpha Test & Open Beta dates */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Ngày Alpha Test</label>
                  <input
                    type="datetime-local"
                    value={editForm.alphaTestDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, alphaTestDate: e.target.value }))}
                    className="datetime-local-dark w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Ngày Open Beta</label>
                  <input
                    type="datetime-local"
                    value={editForm.openBetaDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, openBetaDate: e.target.value }))}
                    className="datetime-local-dark w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Version, EXP, Drop */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Phiên bản (Season)</label>
                  <input
                    type="text"
                    value={editForm.version}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, version: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                    placeholder="Season 6.3..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">EXP</label>
                  <input
                    type="text"
                    value={editForm.exp}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, exp: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                    placeholder="x500..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">DROP</label>
                  <input
                    type="text"
                    value={editForm.drop}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, drop: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                    placeholder="30%..."
                  />
                </div>
              </div>

              {/* Facebook & Zalo */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Link Facebook Fanpage/Group</label>
                  <input
                    type="url"
                    value={editForm.facebookUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Link Box Zalo</label>
                  <input
                    type="url"
                    value={editForm.zaloUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, zaloUrl: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                    placeholder="https://zalo.me/g/..."
                  />
                </div>
              </div>

              {/* Nội dung giới thiệu */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Nội dung giới thiệu máy chủ</label>
                <textarea
                  rows={4}
                  value={editForm.content}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="Thông tin tính năng, sự kiện máy chủ..."
                />
              </div>

              {/* SEO keywords */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Từ khóa SEO (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={editForm.seoKeywords}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, seoKeywords: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="mu moi ra, mu season 6, mu non reset"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingServer(null)}
                  disabled={saving}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/70 bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2 text-xs font-bold text-amber-50 shadow-md transition hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
