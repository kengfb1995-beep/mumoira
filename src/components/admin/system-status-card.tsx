"use client";

import { useState } from "react";

export function SystemStatusCard() {
  const [status, setStatus] = useState<string>("Chưa kiểm tra");
  const [loading, setLoading] = useState(false);

  async function checkHealth() {
    setLoading(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; db?: string; timestamp?: string };
      if (res.ok && data.ok) {
        setStatus(`Hệ thống hoạt động tốt · DB: ${data.db} · ${data.timestamp}`);
      } else {
        setStatus("Healthcheck thất bại");
      }
    } catch {
      setStatus("Không thể kết nối endpoint healthcheck");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
      <h2 className="text-lg font-semibold text-amber-200">Trạng thái hệ thống</h2>
      <p className="mt-1 text-sm text-zinc-300">{status}</p>
      <button
        onClick={checkHealth}
        disabled={loading}
        className="mt-3 rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60"
      >
        {loading ? "Đang kiểm tra..." : "Kiểm tra health"}
      </button>
    </section>
  );
}
