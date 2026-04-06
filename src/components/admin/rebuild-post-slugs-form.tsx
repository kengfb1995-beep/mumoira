"use client";

import { useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

type RebuildResponse = {
  ok?: boolean;
  total?: number;
  updated?: number;
  message?: string;
};

export function RebuildPostSlugsForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const notify = useUiNotify();

  async function handleRebuild() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/posts/rebuild-slugs", {
        method: "POST",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      });

      const data = (await res.json()) as RebuildResponse;
      if (!res.ok) {
        const msg = data.message ?? "Không thể rebuild slug bài viết";
        setMessage(msg);
        notify({ type: "error", title: msg });
        return;
      }

      const msg = `Đã xử lý slug: cập nhật ${data.updated ?? 0}/${data.total ?? 0} bài`;
      setMessage(msg);
      notify({ type: "success", title: msg });
    } catch {
      const msg = "Mất kết nối khi rebuild slug";
      setMessage(msg);
      notify({ type: "error", title: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/25 bg-black/20 p-4">
      <p className="text-sm text-zinc-300">
        Chuẩn hóa lại toàn bộ slug theo title để URL bài viết luôn sạch, nhất quán và chuẩn SEO.
      </p>

      <button
        onClick={handleRebuild}
        disabled={loading}
        className="rounded-md border border-amber-600/60 bg-amber-700/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-700/40 disabled:opacity-60"
      >
        {loading ? "Đang rebuild slug..." : "Rebuild slug bài viết"}
      </button>

      {message ? <p className="text-sm text-zinc-100">{message}</p> : null}
    </div>
  );
}
