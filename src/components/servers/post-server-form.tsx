"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useUiNotify } from "@/components/providers/ui-provider";

type MyServer = {
  id: number;
  name: string;
  openBetaDate?: Date | number | null;
  alphaTestDate?: Date | number | null;
};

export function PostServerForm() {
  const notify = useUiNotify();
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<MyServer[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    version: "",
    exp: "",
    drop: "",
    websiteUrl: "",
    bannerUrl: "",
    openBetaDate: "",
    alphaTestDate: "",
  });

  async function refreshBalance() {
    setBalanceLoading(true);
    const res = await fetch("/api/me/balance", { cache: "no-store" });
    if (!res.ok) {
      setBalanceLoading(false);
      return;
    }
    const data = (await res.json()) as { balance: number };
    setBalance(data.balance);
    setBalanceLoading(false);
  }

  useEffect(() => {
    void refreshBalance();
  }, []);

  async function createServer() {
    if (loading) return;

    if (balance != null && balance < 5000) {
      notify({ type: "error", title: "Số dư không đủ, cần tối thiểu 5.000đ" });
      return;
    }

    const ok = window.confirm("Đăng server sẽ trừ 5.000đ. Bạn chắc chắn muốn tiếp tục?");
    if (!ok) return;

    setLoading(true);
    const payload = {
      ...form,
      openBetaDate: new Date(form.openBetaDate).toISOString(),
      alphaTestDate: new Date(form.alphaTestDate).toISOString(),
    };

    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { message?: string; server: MyServer | null };
    setLoading(false);
    await refreshBalance();

    if (!res.ok) {
      notify({ type: "error", title: data.message ?? "Không thể đăng server" });
      return;
    }

    notify({ type: "success", title: "Đăng server thành công, đã trừ 5.000đ" });
    const createdServer = data.server;
    if (createdServer) {
      setServers((prev) => [createdServer, ...prev]);
    }
  }

  async function updateDates(serverId: number, openBetaDate: string, alphaTestDate: string) {
    const res = await fetch("/api/servers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: serverId, openBetaDate, alphaTestDate }),
    });

    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      notify({ type: "error", title: data.message ?? "Cập nhật thất bại" });
      return;
    }

    notify({ type: "success", title: "Đã cập nhật ngày Open Beta và Alpha Test" });
  }

  return (
    <div className="space-y-4 rounded-3xl border border-amber-500/20 bg-black/25 p-4">
      <div className="rounded-lg border border-amber-500/20 bg-black/30 p-3 text-sm text-zinc-200">
        {balanceLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-700/70" />
            <div className="h-4 w-52 animate-pulse rounded bg-zinc-700/60" />
          </div>
        ) : (
          <>
            <p>Số dư hiện tại: {balance == null ? "Không xác định" : `${balance.toLocaleString("vi-VN")}đ`}</p>
            <p>Sau khi đăng server dự kiến: {balance == null ? "..." : `${(balance - 5000).toLocaleString("vi-VN")}đ`}</p>
          </>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input placeholder="Tên server" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
        <input placeholder="EXP" value={form.exp} onChange={(e) => setForm({ ...form, exp: e.target.value })} />
        <input placeholder="Drop" value={form.drop} onChange={(e) => setForm({ ...form, drop: e.target.value })} />
        <input placeholder="Website URL" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
        <input placeholder="Banner URL (optional)" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
        <input type="datetime-local" value={form.openBetaDate} onChange={(e) => setForm({ ...form, openBetaDate: e.target.value })} />
        <input type="datetime-local" value={form.alphaTestDate} onChange={(e) => setForm({ ...form, alphaTestDate: e.target.value })} />
      </div>

      {balance != null && balance < 5000 ? <p className="text-sm text-red-300">Số dư không đủ để đăng server.</p> : null}

      <button
        onClick={createServer}
        disabled={loading || (balance != null && balance < 5000)}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Đang tạo..." : "Đăng server (5.000đ)"}
      </button>

      {!!servers.length && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-200">Server vừa tạo (có thể sửa ngày Open/Alpha)</h2>
          {servers.map((server) => (
            <ServerDateEditor key={server.id} server={server} onSave={updateDates} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServerDateEditor({
  server,
  onSave,
}: {
  server: MyServer;
  onSave: (id: number, openBetaDate: string, alphaTestDate: string) => Promise<void>;
}) {
  const [openBetaDate, setOpenBetaDate] = useState("");
  const [alphaTestDate, setAlphaTestDate] = useState("");

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-black/30 p-3">
      <p className="font-medium text-amber-100">{server.name}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <input type="datetime-local" value={openBetaDate} onChange={(e) => setOpenBetaDate(e.target.value)} />
        <input type="datetime-local" value={alphaTestDate} onChange={(e) => setAlphaTestDate(e.target.value)} />
      </div>
      <button className="mt-2" onClick={() => onSave(server.id, openBetaDate, alphaTestDate)}>
        Lưu ngày Open/Alpha
      </button>
    </div>
  );
}
