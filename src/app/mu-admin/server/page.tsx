"use client";

import { useState, useEffect } from "react";
import { Crown, Flag, Shield, ShieldCheck, Trash2, X } from "lucide-react";

type ServerRow = {
  id: number;
  name: string;
  userId: number;
  version: string;
  exp: string;
  drop: string;
  vipPackageType: string;
  status: string;
  createdAt: string;
};

const statusOptions = ["pending", "active", "archived", "rejected"] as const;
const vipOptions = ["vip_gold", "vip_silver", "none"] as const;

export default function ServerPage() {
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/server");
        if (!res.ok) return;
        const data = (await res.json()) as { servers?: ServerRow[] };
        setServers(data.servers ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
      }
    } finally {
      setUpdating(null);
    }
  }

  async function deleteServer(id: number) {
    if (!confirm(`Xóa server #${id}? Hành động này không thể hoàn tác.`)) return;
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/server", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setServers((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Flag className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Quản lý Server</h1>
          <p className="text-sm text-zinc-400">Duyệt, từ chối, xóa và nâng cấp VIP cho server.</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        {(["pending", "active", "archived", "rejected"] as const).map((s) => (
          <div key={s} className="rounded-xl border border-amber-500/20 bg-black/25 p-3">
            <p className="text-sm text-zinc-300 capitalize">{s}</p>
            <p className="mt-1 text-xl font-extrabold text-amber-100">
              {servers.filter((x) => x.status === s).length}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-500/20 text-left text-zinc-400">
                <th className="pb-2 pr-4 font-medium">ID</th>
                <th className="pb-2 pr-4 font-medium">Tên</th>
                <th className="pb-2 pr-4 font-medium">Phiên bản</th>
                <th className="pb-2 pr-4 font-medium">EXP / Drop</th>
                <th className="pb-2 pr-4 font-medium">Trạng thái</th>
                <th className="pb-2 pr-4 font-medium">VIP</th>
                <th className="pb-2 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => (
                <tr key={s.id} className="border-b border-amber-500/10 text-zinc-100">
                  <td className="py-3 pr-4 font-mono text-zinc-400">#{s.id}</td>
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  <td className="py-3 pr-4 text-zinc-300">v{s.version}</td>
                  <td className="py-3 pr-4 text-zinc-300">{s.exp} / {s.drop}</td>
                  <td className="py-3 pr-4">
                    <select
                      value={s.status}
                      disabled={updating === s.id}
                      onChange={(e) => updateServer(s.id, { status: e.target.value })}
                      className="rounded border border-amber-500/30 bg-black/50 px-2 py-1 text-xs text-zinc-100 focus:border-amber-400/70 focus:outline-none"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={s.vipPackageType}
                      disabled={updating === s.id}
                      onChange={(e) => updateServer(s.id, { vipPackageType: e.target.value })}
                      className="rounded border border-amber-500/30 bg-black/50 px-2 py-1 text-xs text-zinc-100 focus:border-amber-400/70 focus:outline-none"
                    >
                      {vipOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt === "none" ? "Không VIP" : opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    {updating === s.id ? (
                      <span className="text-xs text-zinc-500">Đang lưu...</span>
                    ) : s.status === "pending" ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => updateServer(s.id, { status: "active" })}
                          className="rounded border border-emerald-600/50 bg-emerald-900/40 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => updateServer(s.id, { status: "rejected" })}
                          className="rounded border border-red-600/50 bg-red-900/40 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/60"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => deleteServer(s.id)}
                          className="rounded border border-red-700/60 bg-red-950/50 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/60"
                          title="Xóa server"
                        >
                          <Trash2 className="inline h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => updateServer(s.id, { vipPackageType: s.vipPackageType === "vip_gold" ? "none" : "vip_gold" })}
                          className="rounded border border-yellow-600/50 bg-yellow-900/40 px-2 py-1 text-xs font-semibold text-yellow-300 hover:bg-yellow-900/60"
                        >
                          <Crown className="mr-1 inline h-3 w-3" />
                          {s.vipPackageType === "vip_gold" ? "Bỏ VIP Vàng" : "VIP Vàng"}
                        </button>
                        <button
                          onClick={() => deleteServer(s.id)}
                          className="rounded border border-red-700/60 bg-red-950/50 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/60"
                          title="Xóa server"
                        >
                          <Trash2 className="inline h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {servers.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Chưa có server nào.</p>
          )}
        </div>
      )}
    </div>
  );
}
