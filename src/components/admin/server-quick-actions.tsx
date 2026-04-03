"use client";

import { useState } from "react";
import { useUiNotify } from "@/components/providers/ui-provider";
import { withCsrfHeaders } from "@/lib/csrf-client";

type ServerRow = {
  id: number;
  name: string;
  status: "draft" | "pending" | "active" | "archived";
  vipPackageType: "none" | "vip_silver" | "vip_gold";
};

export function ServerQuickActions({ initialServers }: { initialServers: ServerRow[] }) {
  const [servers, setServers] = useState(initialServers);
  const notify = useUiNotify();

  async function updateServer(serverId: number, status: ServerRow["status"], vipPackageType: ServerRow["vipPackageType"]) {
    const res = await fetch("/api/admin/servers/status", {
      method: "PATCH",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id: serverId, status, vipPackageType }),
    });

    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      notify({ type: "error", title: data.message ?? "Cập nhật server thất bại" });
      return;
    }

    setServers((prev) => prev.map((item) => (item.id === serverId ? { ...item, status, vipPackageType } : item)));
    notify({ type: "success", title: "Đã cập nhật trạng thái server" });
  }

  return (
    <div className="space-y-2 text-sm">
      {servers.map((item) => (
        <div key={item.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2">
          <p className="font-medium text-amber-100">#{item.id} · {item.name}</p>
          <p className="text-zinc-300">VIP: {item.vipPackageType} · Trạng thái: {item.status}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => updateServer(item.id, "active", item.vipPackageType)} className="rounded-md border border-emerald-500/40 bg-emerald-700/20 px-2 py-1 text-xs text-emerald-200">Duyệt</button>
            <button onClick={() => updateServer(item.id, "archived", "none")} className="rounded-md border border-red-500/40 bg-red-700/20 px-2 py-1 text-xs text-red-200">Từ chối</button>
            <button onClick={() => updateServer(item.id, item.status, "vip_gold")} className="rounded-md border border-yellow-500/40 bg-yellow-700/20 px-2 py-1 text-xs text-yellow-200">Đẩy VIP Gold</button>
            <button onClick={() => updateServer(item.id, item.status, "vip_silver")} className="rounded-md border border-zinc-400/40 bg-zinc-700/20 px-2 py-1 text-xs text-zinc-200">Đẩy VIP Silver</button>
          </div>
        </div>
      ))}
    </div>
  );
}
