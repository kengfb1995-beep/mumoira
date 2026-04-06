"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Eye, ImageIcon, Trash2, XCircle } from "lucide-react";

type BannerRow = {
  id: number;
  userId: number;
  position: string;
  imageUrl: string;
  targetUrl: string;
  status: string;
  startDate: number;
  endDate: number;
  createdAt: string;
};

const statusOptions = ["pending", "active", "expired", "rejected"] as const;

export default function BannerPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [preview, setPreview] = useState<BannerRow | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/banner");
        if (!res.ok) return;
        const data = (await res.json()) as { banners?: BannerRow[] };
        setBanners(data.banners ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function updateBanner(id: number, patch: { status?: string }) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
      }
    } finally {
      setUpdating(null);
    }
  }

  async function deleteBanner(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa banner này vĩnh viễn?")) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/banner?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <ImageIcon className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Quản lý Banner</h1>
          <p className="text-sm text-zinc-400">Duyệt, từ chối và quản lý banner quảng cáo.</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        {(["pending", "active", "expired", "rejected"] as const).map((s) => (
          <div key={s} className="rounded-xl border border-amber-500/20 bg-black/25 p-3">
            <p className="text-sm text-zinc-300 capitalize">{s}</p>
            <p className="mt-1 text-xl font-extrabold text-amber-100">
              {banners.filter((b) => b.status === s).length}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-black/25 p-4">
              {/* Thumbnail */}
              <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded-md border border-amber-500/20 bg-black/40">
                <img src={b.imageUrl} alt={`Banner ${b.id}`} className="h-full w-full object-cover" loading="lazy" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">{b.position}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    b.status === "active" ? "bg-emerald-900/50 text-emerald-300" :
                    b.status === "pending" ? "bg-yellow-900/50 text-yellow-300" :
                    b.status === "expired" ? "bg-zinc-800 text-zinc-400" :
                    "bg-red-900/50 text-red-300"
                  }`}>
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-zinc-300">{b.targetUrl}</p>
                <p className="text-xs text-zinc-500">
                  #{b.id} · {new Date(b.startDate).toLocaleDateString("vi-VN")} → {new Date(b.endDate).toLocaleDateString("vi-VN")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => setPreview(b)}
                  className="rounded border border-amber-500/40 bg-amber-900/30 p-2 text-amber-200 hover:bg-amber-900/50"
                  title="Xem trước"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {b.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateBanner(b.id, { status: "active" })}
                      disabled={updating === b.id}
                      className="rounded border border-emerald-600/50 bg-emerald-900/40 p-2 text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-50"
                      title="Duyệt"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateBanner(b.id, { status: "rejected" })}
                      disabled={updating === b.id}
                      className="rounded border border-red-600/50 bg-red-900/40 p-2 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                      title="Từ chối"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </>
                )}

                {b.status === "active" && (
                  <button
                    onClick={() => updateBanner(b.id, { status: "expired" })}
                    disabled={updating === b.id}
                    className="rounded border border-zinc-600/50 bg-zinc-900/40 p-2 text-zinc-400 hover:bg-zinc-900/60 disabled:opacity-50"
                    title="Hết hạn"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => deleteBanner(b.id)}
                  disabled={updating === b.id}
                  className="rounded border border-red-600/50 bg-red-900/40 p-2 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                  title="Xóa vĩnh viễn"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Chưa có banner nào.</p>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}>
          <div className="max-w-2xl rounded-2xl border border-amber-500/35 bg-[#120808] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-100">Xem trước Banner #{preview.id}</h3>
              <button onClick={() => setPreview(null)}
                className="rounded-md border border-amber-500/30 p-1.5 text-amber-200 hover:bg-amber-900/30">
                ✕
              </button>
            </div>
            <a href={preview.targetUrl} target="_blank" rel="noopener noreferrer">
              <img src={preview.imageUrl} alt={`Banner ${preview.id}`} className="max-h-[400px] w-full rounded-lg border border-amber-500/20 object-contain" />
            </a>
            <p className="mt-3 text-sm text-zinc-400">Vị trí: <strong className="text-amber-200">{preview.position}</strong> · <a href={preview.targetUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">{preview.targetUrl}</a></p>
          </div>
        </div>
      )}
    </div>
  );
}
