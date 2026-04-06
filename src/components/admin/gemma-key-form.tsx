"use client";

import { useEffect, useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

function maskKey(key: string) {
  if (!key || key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(Math.max(0, key.length - 8))}${key.slice(-4)}`;
}

export function GemmaKeyForm({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [message, setMessage] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const notify = useUiNotify();

  // Load saved key from DB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings/key?key=GEMMA_API_KEY");
        if (res.ok) {
          const data = (await res.json()) as { value?: string };
          if (!cancelled && data.value) {
            setValue(data.value);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function submit() {
    setMessage(null);
    const res = await fetch("/api/admin/settings/gemma", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ value }),
    });

    const payload = (await res.json()) as { message?: string };
    if (!res.ok) {
      const msg = payload.message ?? "Cập nhật thất bại";
      setMessage(msg);
      notify({ type: "error", title: msg });
      return;
    }

    setMessage("Cập nhật Gemma API Key thành công");
    notify({ type: "success", title: "Đã lưu Gemma API Key" });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type={showKey ? "text" : "password"}
          value={showKey ? value : (value ? maskKey(value) : "")}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập Gemma/OpenRouter API Key"
          className="flex-1 rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
          style={{ fontFamily: showKey ? "monospace" : undefined }}
        />
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-xs text-zinc-400 hover:text-amber-200"
          title={showKey ? "Ẩn key" : "Hiện key"}
        >
          {showKey ? "Ẩn" : "Hiện"}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100"
        >
          Lưu API Key
        </button>
        {message ? <span className="text-sm text-emerald-400">{message}</span> : null}
      </div>
    </div>
  );
}
