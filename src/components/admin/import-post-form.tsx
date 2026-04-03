"use client";

import { useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

export function ImportPostForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const notify = useUiNotify();

  async function submit() {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/admin/posts/import", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ url }),
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
  }

  return (
    <div className="space-y-3">
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="Nhập URL bài viết nguồn cần cào"
        className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={loading || !url}
        className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60"
      >
        {loading ? "Đang cào và rewrite..." : "Cào + AI Rewrite + Lưu bài"}
      </button>
      {message ? <p className="text-sm text-zinc-200">{message}</p> : null}
    </div>
  );
}
