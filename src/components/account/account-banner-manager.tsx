"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Globe,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import { useUi } from "@/components/providers/ui-provider";
import { formatDateTimeShortVietnam } from "@/lib/vn-datetime";

export type AccountBannerItem = {
  id: number;
  userId: number;
  position: string;
  imageUrl: string;
  targetUrl: string;
  startDate: Date | number;
  endDate: Date | number;
  status: string;
  createdAt: Date | number;
  updatedAt: Date | number;
};

const POSITION_LABELS: Record<string, { label: string; dims: string; aspect: string }> = {
  center_top: { label: "Banner Giữa Lớn (Top)", dims: "780×280 px", aspect: "aspect-[780/280]" },
  center_mid: { label: "Banner Giữa Ngang (Mid)", dims: "780×110 px", aspect: "aspect-[780/110]" },
  center_bottom: { label: "Banner Giữa Dưới", dims: "780×110 px", aspect: "aspect-[780/110]" },
  left_sidebar: { label: "Banner Cánh Trái (Left)", dims: "204×390 px", aspect: "aspect-[204/390]" },
  right_sidebar: { label: "Banner Cánh Phải (Right)", dims: "204×390 px", aspect: "aspect-[204/390]" },
};

export function AccountBannerManager({
  initialBanners,
}: {
  initialBanners: AccountBannerItem[];
}) {
  const { notify } = useUi();
  const [bannersList, setBannersList] = useState<AccountBannerItem[]>(initialBanners);
  const [editingBanner, setEditingBanner] = useState<AccountBannerItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state
  const [editForm, setEditForm] = useState({
    imageUrl: "",
    targetUrl: "",
  });

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
    notify({ type: "info", title: "Đã sao chép vào bộ nhớ tạm" });
  }

  function openEditModal(banner: AccountBannerItem) {
    setEditingBanner(banner);
    setEditForm({
      imageUrl: banner.imageUrl || "",
      targetUrl: banner.targetUrl || "",
    });
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBanner || saving) return;

    if (!editForm.imageUrl.trim() || !/^https?:\/\/.+/.test(editForm.imageUrl.trim())) {
      notify({
        type: "error",
        title: "Link ảnh không hợp lệ (cần bắt đầu bằng http:// hoặc https://)",
      });
      return;
    }

    if (!editForm.targetUrl.trim() || !/^https?:\/\/.+/.test(editForm.targetUrl.trim())) {
      notify({
        type: "error",
        title: "Link đích không hợp lệ (cần bắt đầu bằng http:// hoặc https://)",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/me/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBanner.id,
          imageUrl: editForm.imageUrl.trim(),
          targetUrl: editForm.targetUrl.trim(),
        }),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        notify({ type: "error", title: data.message ?? "Cập nhật banner thất bại" });
        setSaving(false);
        return;
      }

      notify({ type: "success", title: "Cập nhật banner thành công!" });

      // Update local state
      setBannersList((prev) =>
        prev.map((item) =>
          item.id === editingBanner.id
            ? {
                ...item,
                imageUrl: editForm.imageUrl.trim(),
                targetUrl: editForm.targetUrl.trim(),
                updatedAt: Date.now(),
              }
            : item,
        ),
      );

      setEditingBanner(null);
    } catch {
      notify({ type: "error", title: "Lỗi kết nối máy chủ" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header action */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-amber-200 sm:text-xl">Banner quảng cáo của bạn</h2>
          <p className="text-xs text-zinc-400">
            Quản lý và cập nhật lại link ảnh hoặc link đích của banner bất cứ lúc nào nếu nhập sai hoặc muốn đổi banner mới.
          </p>
        </div>
        <Link
          href="/tai-khoan/mua-dich-vu"
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-600/30 to-amber-700/30 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:border-amber-400 hover:text-amber-100"
        >
          <Plus className="h-4 w-4" />
          Thuê Thêm Banner
        </Link>
      </div>

      {bannersList.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/20 bg-black/25 p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <p className="font-semibold text-amber-100">Bạn chưa thuê banner quảng cáo nào</p>
          <p className="mt-1 text-xs text-zinc-400">
            Thuê banner ở các vị trí đắc địa (Đầu trang, Giữa trang, Cánh hai bên) để quảng bá máy chủ MU Online hiệu quả nhất!
          </p>
          <div className="mt-4">
            <Link
              href="/tai-khoan/mua-dich-vu"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/60 bg-amber-600/20 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-600/30"
            >
              <ShoppingBag className="h-4 w-4" />
              Xem Bảng Giá & Thuê Banner
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bannersList.map((banner) => {
            const posInfo = POSITION_LABELS[banner.position] || {
              label: banner.position,
              dims: "Banner",
              aspect: "aspect-video",
            };
            const isVideo = banner.imageUrl.toLowerCase().endsWith(".mp4");
            const now = Date.now();
            const endMs = new Date(banner.endDate).getTime();
            const isExpired = endMs < now;

            return (
              <div
                key={banner.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/25 bg-black/35 p-4 sm:p-5 transition hover:border-amber-500/45 shadow-sm"
              >
                {/* Header card */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-200 text-sm">{posInfo.label}</span>
                      <p className="text-[11px] text-zinc-400">Chuẩn kích thước: {posInfo.dims}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          banner.status === "active" && !isExpired
                            ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                            : isExpired || banner.status === "expired"
                              ? "border border-zinc-700 bg-zinc-800 text-zinc-400"
                              : "border border-yellow-500/40 bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {isExpired
                          ? "Hết hạn"
                          : banner.status === "active"
                            ? "Đang hiển thị"
                            : banner.status === "pending"
                              ? "Chờ duyệt"
                              : banner.status}
                      </span>

                      <button
                        onClick={() => openEditModal(banner)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-600/20 px-2.5 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-600/30 hover:border-amber-400"
                      >
                        <Pencil className="h-3 w-3" />
                        Sửa
                      </button>
                    </div>
                  </div>

                  {/* Banner Preview Frame */}
                  <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-zinc-950 p-1">
                    {isVideo ? (
                      <video
                        src={banner.imageUrl}
                        className="w-full max-h-48 rounded object-contain"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt={`Banner ${posInfo.label}`}
                        className="w-full max-h-48 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/600x200/1a1a1a/eab308?text=Loi+Link+Anh+Banner";
                        }}
                      />
                    )}
                  </div>

                  {/* Links info */}
                  <div className="space-y-1.5 text-xs">
                    {/* Image URL */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-black/40 px-2.5 py-1.5">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="text-[11px] text-zinc-400">Ảnh:</span>
                      <span className="truncate font-mono text-[11px] text-zinc-300 flex-1">
                        {banner.imageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(banner.imageUrl, `img-${banner.id}`)}
                        className="text-zinc-400 hover:text-amber-300"
                      >
                        {copiedKey === `img-${banner.id}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Target URL */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-black/40 px-2.5 py-1.5">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="text-[11px] text-zinc-400">Đích:</span>
                      <span className="truncate font-mono text-[11px] text-zinc-300 flex-1">
                        {banner.targetUrl}
                      </span>
                      <a
                        href={banner.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-amber-300"
                        title="Mở link đích"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(banner.targetUrl, `target-${banner.id}`)}
                        className="text-zinc-400 hover:text-amber-300"
                      >
                        {copiedKey === `target-${banner.id}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dates footer */}
                <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2.5 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-400/70" />
                    <span>Bắt đầu: {formatDateTimeShortVietnam(new Date(banner.startDate))}</span>
                  </div>
                  <div>
                    <span>Hết hạn: </span>
                    <span className={`font-semibold ${isExpired ? "text-red-400" : "text-amber-200"}`}>
                      {formatDateTimeShortVietnam(new Date(banner.endDate))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SỬA BANNER */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <h3 className="text-base font-bold text-amber-200 sm:text-lg flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-amber-400" />
                  Sửa Link Ảnh & Link Đích Banner
                </h3>
                <p className="text-xs text-zinc-400">
                  {POSITION_LABELS[editingBanner.position]?.label ?? editingBanner.position} (
                  {POSITION_LABELS[editingBanner.position]?.dims ?? ""})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {/* Link ảnh banner */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-100 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                    Link ảnh / video banner (`imageUrl`) <span className="text-red-400">*</span>
                  </label>
                  {editForm.imageUrl && (
                    <a
                      href={editForm.imageUrl}
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
                  required
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="https://domain.com/banner.gif"
                />
                <p className="text-[11px] text-zinc-500">
                  Hỗ trợ định dạng .jpg, .png, .gif, .webp hoặc video .mp4
                </p>

                {/* Live Preview */}
                {editForm.imageUrl ? (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-400">
                      Xem trước trực tiếp (Live Preview):
                    </span>
                    <div className="flex justify-center rounded-xl border border-amber-500/40 bg-zinc-950 p-2">
                      {editForm.imageUrl.toLowerCase().endsWith(".mp4") ? (
                        <video
                          src={editForm.imageUrl}
                          className="max-h-48 w-auto rounded object-contain"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editForm.imageUrl}
                          alt="Xem trước banner"
                          className="max-h-48 w-auto rounded object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/600x200/1a1a1a/eab308?text=Link+Anh+Khong+Hop+Le";
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Link đích */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-100 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-amber-400" />
                    Link đích khi người chơi click (`targetUrl`) <span className="text-red-400">*</span>
                  </label>
                  {editForm.targetUrl && (
                    <a
                      href={editForm.targetUrl}
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
                  value={editForm.targetUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                  placeholder="https://mu-online.vn"
                />
                <p className="text-[11px] text-zinc-500">
                  Khi người chơi nhấp vào banner trên website, họ sẽ được chuyển hướng tới link này.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
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
