"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useUi } from "@/components/providers/ui-provider";
import { toDatetimeLocalValueVn } from "@/lib/vn-datetime";

type MyServer = {
  id: number;
  name: string;
  openBetaDate?: Date | number | null;
  alphaTestDate?: Date | number | null;
};

export function PostServerForm() {
  const { notify, confirm } = useUi();
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
    content: "",
    seoKeywords: "",
    openBetaDate: "",
    alphaTestDate: "",
    facebookUrl: "",
    zaloUrl: "",
  });

  const tagsCount = useMemo(
    () => form.seoKeywords.split(",").map((item) => item.trim()).filter(Boolean).length,
    [form.seoKeywords],
  );

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

    if (!form.name.trim()) {
      notify({ type: "error", title: "Vui lòng nhập tên server" });
      return;
    }
    if (!form.version.trim()) {
      notify({ type: "error", title: "Vui lòng nhập phiên bản (Season)" });
      return;
    }
    if (!form.exp.trim()) {
      notify({ type: "error", title: "Vui lòng nhập EXP" });
      return;
    }
    if (!form.drop.trim()) {
      notify({ type: "error", title: "Vui lòng nhập Drop" });
      return;
    }
    if (!form.websiteUrl.trim() || !/^https?:\/\/.+/.test(form.websiteUrl)) {
      notify({ type: "error", title: "Website URL phải bắt đầu bằng http:// hoặc https://" });
      return;
    }
    if (form.content.trim().length < 30) {
      notify({ type: "error", title: "Nội dung giới thiệu phải từ 30 ký tự trở lên" });
      return;
    }
    if (!form.facebookUrl.trim() && !form.zaloUrl.trim()) {
      notify({ type: "error", title: "Vui lòng nhập Facebook hoặc Zalo để người chơi liên hệ" });
      return;
    }
    if (tagsCount < 2) {
      notify({ type: "error", title: "Vui lòng nhập ít nhất 2 từ khóa SEO" });
      return;
    }

    const ok = await confirm({
      title: "Xác nhận đăng server",
      description: "Đăng server sẽ trừ 5.000đ từ số dư tài khoản. Bạn có chắc chắn muốn tiếp tục?",
      confirmLabel: "Tiếp tục",
      cancelLabel: "Hủy",
    });
    if (!ok) return;

    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const payload = {
        name: form.name,
        version: form.version,
        exp: form.exp,
        drop: form.drop,
        websiteUrl: form.websiteUrl,
        content: form.content,
        seoKeywords: form.seoKeywords,
        openBetaDate: form.openBetaDate || toDatetimeLocalValueVn(Date.now() + 7 * 24 * 60 * 60 * 1000),
        alphaTestDate: form.alphaTestDate || toDatetimeLocalValueVn(Date.now() + 3 * 24 * 60 * 60 * 1000),
        facebookUrl: form.facebookUrl,
        zaloUrl: form.zaloUrl,
      };

      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = (await res.json()) as { message?: string; server: MyServer | null };

      if (!res.ok) {
        notify({ type: "error", title: data.message ?? "Không thể đăng server" });
        void refreshBalance();
        return;
      }

      notify({ type: "success", title: "Đăng server thành công, đã trừ 5.000đ" });
      const createdServer = data.server;
      if (createdServer) {
        setServers((prev) => [createdServer, ...prev]);
      }
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error && err.name === "AbortError" ? "Yêu cầu hết thời gian. Vui lòng thử lại." : "Đăng server thất bại. Vui lòng thử lại.";
      notify({ type: "error", title: msg });
    } finally {
      setLoading(false);
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
    <div className="space-y-4 rounded-3xl border border-amber-500/25 bg-black/30 p-4 md:p-5">
      <div className="rounded-lg border border-amber-500/20 bg-black/35 p-3 text-sm text-zinc-200">
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

      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">Thông tin hiển thị trên danh sách (mumoira)</p>
      <div className="rounded-lg border border-amber-500/25 bg-black/35 p-3 text-xs text-zinc-300">
        <p className="font-semibold text-amber-200">Dòng tiêu đề trên trang chủ:</p>
        <p className="mt-1 break-words text-zinc-200">
          {form.name.trim() || "Tên server"} - Season {form.version.trim() || "…"} - Exp: {form.exp.trim() || "…"} - Drop:{" "}
          {form.drop.trim() || "…"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Tên server <span className="text-red-400">*</span></label>
          <input placeholder="VD: Mu Việt Nam Season 20" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Phiên bản (Season) <span className="text-red-400">*</span></label>
          <input placeholder="VD: Season 20" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">EXP <span className="text-red-400">*</span></label>
          <input placeholder="VD: 100x, 500x, 2000x" value={form.exp} onChange={(e) => setForm({ ...form, exp: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Drop <span className="text-red-400">*</span></label>
          <input placeholder="VD: 10%, 30%, 50%" value={form.drop} onChange={(e) => setForm({ ...form, drop: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Ngày Alpha Test</label>
          <p className="mb-0.5 text-[11px] text-zinc-500">
            Giờ theo Việt Nam (UTC+7). Hiển thị cột phải trên danh sách; nên điền để người chơi biết lịch test.
          </p>
          <input type="datetime-local" value={form.alphaTestDate} onChange={(e) => setForm({ ...form, alphaTestDate: e.target.value })} className="datetime-local-dark w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 md:max-w-md" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Ngày Open Beta</label>
          <p className="mb-0.5 text-[11px] text-zinc-500">
            Giờ theo Việt Nam (UTC+7). Hiển thị cột phải; ngày mở trùng &quot;hôm nay&quot; (theo giờ VN) sẽ tô đỏ trên danh sách.
          </p>
          <input type="datetime-local" value={form.openBetaDate} onChange={(e) => setForm({ ...form, openBetaDate: e.target.value })} className="datetime-local-dark w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 md:max-w-md" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Website URL <span className="text-red-400">*</span></label>
          <input placeholder="https://muvietnam.com" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Từ khóa SEO <span className="text-red-400">*</span></label>
          <input placeholder="mu online, season 20, free pvp" value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">Link Facebook / Nhóm FB <span className="text-red-400">*</span></label>
          <input placeholder="facebook.com/groups/..." value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-200 sm:text-sm">SĐT Zalo / Link Nhóm Zalo <span className="text-red-400">*</span></label>
          <input placeholder="098xxxxxxxx hoặc link zalo.me" value={form.zaloUrl} onChange={(e) => setForm({ ...form, zaloUrl: e.target.value })} className="w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-amber-200">Nội dung giới thiệu server <span className="text-red-400">*</span></p>
          <p className="text-zinc-300">{form.content.length}/10000</p>
        </div>
        <textarea
          placeholder="Mô tả chi tiết server… Mỗi lần Enter = xuống dòng trên trang chi tiết (1 dòng hiển thị 1 hàng)."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="min-h-40 w-full rounded-xl border border-amber-500/35 bg-black/45 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-black/30 p-3 text-xs text-zinc-300">
        <p>
          Từ khóa SEO hiện có: <span className="font-semibold text-amber-200">{tagsCount}</span>
        </p>
        <p className="mt-1">Đăng server không hỗ trợ upload banner. Banner được quản lý riêng tại mục Tài khoản → Mua dịch vụ.</p>
      </div>

      {balance != null && balance < 5000 ? <p className="text-sm text-red-300">Số dư không đủ để đăng server.</p> : null}

      <button
        onClick={createServer}
        disabled={loading || (balance != null && balance < 5000)}
        className="rounded-xl border border-red-700/60 bg-red-800/85 px-4 py-2.5 font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Đang tạo..." : "Đăng server (5.000đ)"}
      </button>

      {!!servers.length && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-200">Server vừa tạo (có thể chỉnh ngày Open/Alpha)</h2>
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
        <input type="datetime-local" value={openBetaDate} onChange={(e) => setOpenBetaDate(e.target.value)} className="datetime-local-dark w-full rounded-lg border border-amber-500/30 bg-black/40 px-3 py-2 text-sm text-zinc-100" />
        <input type="datetime-local" value={alphaTestDate} onChange={(e) => setAlphaTestDate(e.target.value)} className="datetime-local-dark w-full rounded-lg border border-amber-500/30 bg-black/40 px-3 py-2 text-sm text-zinc-100" />
      </div>
      <button
        className="mt-2 rounded-lg border border-amber-500/30 bg-black/30 px-3 py-1.5 text-sm text-amber-100"
        onClick={() => onSave(server.id, openBetaDate, alphaTestDate)}
      >
        Lưu ngày Open/Alpha
      </button>
    </div>
  );
}
