"use client";

import { useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

export function ImportPostForm() {
  const [url, setUrl] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const notify = useUiNotify();

  async function submit() {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/admin/posts/import", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ url, seoKeywords }),
    });

    const data = (await res.json()) as { message?: string; post?: { title?: string } };
    setLoading(false);

    if (!res.ok) {
      const msg = data.message ?? "Không thể import bài viết";
      setMessage(msg);
      notify({ type: "error", title: msg });
      return;
    }

    const msg = `Đã import bài viết: ${data.post?.title ?? "thành công"}`;
    setMessage(msg);
    notify({ type: "success", title: msg });
    setUrl("");
    setSeoKeywords("");
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/25 bg-black/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-200">URL bài viết nguồn</p>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://..."
          className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-200">Từ khóa SEO (bắt buộc)</p>
        <input
          value={seoKeywords}
          onChange={(event) => setSeoKeywords(event.target.value)}
          placeholder="Ví dụ: mu mới ra, mu season 6, mu private"
          className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
          required
        />
        <p className="text-xs text-zinc-300">Nhập theo dạng danh sách, phân tách bằng dấu phẩy để tối ưu hiển thị tìm kiếm.</p>
      </div>

      <button
        onClick={submit}
        disabled={loading || !url || !seoKeywords.trim()}
        className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60"
      >
        {loading ? "Đang cào và rewrite..." : "Cào + AI Rewrite + Lưu bài"}
      </button>
      {message ? <p className="text-sm text-zinc-200">{message}</p> : null}
    </div>
  );
}
