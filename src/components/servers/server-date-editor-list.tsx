"use client";

import { useEffect, useMemo, useState } from "react";
import { useUiNotify } from "@/components/providers/ui-provider";

type ServerItem = {
  id: number;
  name: string;
  status: "draft" | "pending" | "active" | "archived";
  vipPackageType: "none" | "vip_silver" | "vip_gold";
  openBetaDate: Date | number | null;
  alphaTestDate: Date | number | null;
};

type ActivityItem = {
  id: number;
  referenceId: number;
  serviceType: string;
  amount: number;
  description: string | null;
  createdAt: Date | number;
};

type StatusFilter = "all" | ServerItem["status"];
type SortMode = "newest" | "oldest" | "name_asc";

function toInputDate(value: Date | number | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusBadge(status: ServerItem["status"]) {
  if (status === "active") return "border-emerald-500/40 bg-emerald-700/20 text-emerald-200";
  if (status === "archived") return "border-red-500/40 bg-red-700/20 text-red-200";
  if (status === "draft") return "border-zinc-500/40 bg-zinc-700/20 text-zinc-200";
  return "border-amber-500/40 bg-amber-700/20 text-amber-200";
}

export function ServerDateEditorList({ servers, activities }: { servers: ServerItem[]; activities: ActivityItem[] }) {
  const notify = useUiNotify();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [items, setItems] = useState(
    servers.map((server) => ({
      ...server,
      openBetaDateInput: toInputDate(server.openBetaDate),
      alphaTestDateInput: toInputDate(server.alphaTestDate),
      saving: false,
      buyingVip: false,
    })),
  );
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setHydrating(false), 500);
    return () => window.clearTimeout(id);
  }, []);

  async function save(id: number) {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    if (!target.openBetaDateInput || !target.alphaTestDateInput) {
      notify({ type: "error", title: "Bạn cần nhập đủ ngày Open Beta và Alpha Test" });
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, saving: true } : item)));

    const res = await fetch("/api/servers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        openBetaDate: target.openBetaDateInput,
        alphaTestDate: target.alphaTestDateInput,
      }),
    });

    const data = (await res.json()) as { message?: string };

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, saving: false } : item)));

    if (!res.ok) {
      notify({ type: "error", title: data.message ?? "Cập nhật thất bại" });
      return;
    }

    notify({ type: "success", title: "Đã cập nhật ngày Open/Alpha thành công" });
  }

  async function buyVip(serverId: number, serviceType: "vip_gold" | "vip_silver") {
    setItems((prev) => prev.map((item) => (item.id === serverId ? { ...item, buyingVip: true } : item)));

    const res = await fetch("/api/services/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType, serverId }),
    });

    const data = (await res.json()) as { message?: string };

    setItems((prev) =>
      prev.map((item) =>
        item.id === serverId
          ? { ...item, buyingVip: false, vipPackageType: res.ok ? (serviceType as ServerItem["vipPackageType"]) : item.vipPackageType }
          : item,
      ),
    );

    if (!res.ok) {
      notify({ type: "error", title: data.message ?? "Nâng VIP thất bại" });
      return;
    }

    notify({ type: "success", title: `Đã mua ${serviceType === "vip_gold" ? "VIP Gold" : "VIP Silver"} cho server` });
  }

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let result = [...items];

    if (keyword) {
      result = result.filter((item) => item.name.toLowerCase().includes(keyword) || String(item.id).includes(keyword));
    }

    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (sortMode === "oldest") result.sort((a, b) => a.id - b.id);
    else if (sortMode === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else result.sort((a, b) => b.id - a.id);

    return result;
  }, [items, query, sortMode, statusFilter]);

  if (hydrating) {
    return (
      <div className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="h-10 animate-pulse rounded-xl border border-amber-500/20 bg-black/20" />
          <div className="h-10 animate-pulse rounded-xl border border-amber-500/20 bg-black/20" />
          <div className="h-10 animate-pulse rounded-xl border border-amber-500/20 bg-black/20" />
        </div>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="space-y-2 rounded-2xl border border-amber-500/20 bg-black/30 p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-black/30" />
            <div className="grid gap-2 md:grid-cols-2">
              <div className="h-10 animate-pulse rounded-xl bg-black/30" />
              <div className="h-10 animate-pulse rounded-xl bg-black/30" />
            </div>
            <div className="h-8 w-40 animate-pulse rounded-xl bg-black/30" />
            <div className="h-16 animate-pulse rounded-xl bg-black/30" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) return <p className="text-sm text-zinc-300">Bạn chưa có server nào.</p>;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <input placeholder="Tìm theo tên hoặc ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
          <option value="draft">draft</option>
        </select>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name_asc">Tên A-Z</option>
        </select>
      </div>

      {filteredItems.map((item) => {
        const timeline = activities.filter((a) => a.referenceId === item.id).slice(0, 5);
        return (
          <div key={item.id} className="rounded-2xl border border-amber-500/20 bg-black/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-amber-100">#{item.id} · {item.name}</p>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge(item.status)}`}>{item.status}</span>
                <span className="rounded-full border border-amber-500/30 bg-black/30 px-2 py-0.5 text-xs text-amber-200">VIP: {item.vipPackageType}</span>
              </div>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input type="datetime-local" value={item.openBetaDateInput} onChange={(e) => setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, openBetaDateInput: e.target.value } : row)))} />
              <input type="datetime-local" value={item.alphaTestDateInput} onChange={(e) => setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, alphaTestDateInput: e.target.value } : row)))} />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => save(item.id)} disabled={item.saving} className="rounded-md border border-amber-500/30 bg-black/30 px-3 py-1.5 text-xs text-amber-100">{item.saving ? "Đang lưu..." : "Lưu Open/Alpha"}</button>
              <button onClick={() => buyVip(item.id, "vip_silver")} disabled={item.buyingVip} className="rounded-md border border-zinc-400/40 bg-zinc-700/20 px-3 py-1.5 text-xs text-zinc-200">{item.buyingVip ? "Đang xử lý..." : "Nâng VIP Silver"}</button>
              <button onClick={() => buyVip(item.id, "vip_gold")} disabled={item.buyingVip} className="rounded-md border border-yellow-500/40 bg-yellow-700/20 px-3 py-1.5 text-xs text-yellow-200">{item.buyingVip ? "Đang xử lý..." : "Nâng VIP Gold"}</button>
              {item.status === "archived" ? <a href="/lien-he" className="rounded-md border border-sky-500/40 bg-sky-700/20 px-3 py-1.5 text-xs text-sky-200">Liên hệ admin</a> : null}
            </div>

            <div className="mt-3 rounded-xl border border-amber-500/15 bg-black/20 p-2">
              <p className="mb-1 text-xs font-semibold text-amber-200">Timeline server</p>
              {timeline.length ? (
                <div className="space-y-1 text-xs text-zinc-300">
                  {timeline.map((t) => (
                    <p key={t.id}>• {t.description ?? t.serviceType} ({t.amount.toLocaleString("vi-VN")}đ) · {new Date(t.createdAt).toLocaleString("vi-VN")}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">Chưa có hoạt động gần đây.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
