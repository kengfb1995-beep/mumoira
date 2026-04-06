"use client";

import { CalendarDays } from "lucide-react";
import { useUiNotify } from "@/components/providers/ui-provider";
import { useState } from "react";
import { toDatetimeLocalValueVn } from "@/lib/vn-datetime";

export function ServerDateEditorList({
  serverId,
  initialAlpha,
  initialOpen,
}: {
  serverId: number;
  initialAlpha: Date | number | null;
  initialOpen: Date | number | null;
}) {
  const notify = useUiNotify();
  const [alphaInput, setAlphaInput] = useState(toDatetimeLocalValueVn(initialAlpha));
  const [openInput, setOpenInput] = useState(toDatetimeLocalValueVn(initialOpen));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/servers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: serverId, openBetaDate: openInput, alphaTestDate: alphaInput }),
    });
    setSaving(false);
    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      notify({ type: "error", title: data.message ?? "Cập nhật thất bại" });
      return;
    }
    notify({ type: "success", title: "Đã cập nhật ngày Open/Alpha" });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-amber-400" aria-hidden />
        <span className="text-sm font-semibold text-amber-300">Ngày Open Beta & Alpha Test</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-zinc-500">Alpha Test</label>
          <input
            type="datetime-local"
            value={alphaInput}
            onChange={(e) => setAlphaInput(e.target.value)}
            className="datetime-local-dark w-full rounded-lg border border-[#2a1515] bg-[#0a0505] px-3 py-2 text-sm text-zinc-100 focus:border-red-700/50 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-zinc-500">Open Beta</label>
          <input
            type="datetime-local"
            value={openInput}
            onChange={(e) => setOpenInput(e.target.value)}
            className="datetime-local-dark w-full rounded-lg border border-[#2a1515] bg-[#0a0505] px-3 py-2 text-sm text-zinc-100 focus:border-red-700/50 focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg border border-amber-600/50 bg-amber-700/20 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:border-amber-500 hover:bg-amber-700/30 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu ngày tháng"}
      </button>
    </div>
  );
}
