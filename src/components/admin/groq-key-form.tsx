"use client";

import { useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

export function GroqKeyForm({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [message, setMessage] = useState<string | null>(null);
  const notify = useUiNotify();

  async function submit() {
    setMessage(null);
    const res = await fetch("/api/admin/settings/groq", {
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

    setMessage("Cập nhật GROQ_API_KEY thành công");
    notify({ type: "success", title: "Đã lưu GROQ API Key" });
  }

  return (
    <div className="space-y-3">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Nhập GROQ API Key"
        className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100"
      >
        Lưu API Key
      </button>
      {message ? <p className="text-sm text-zinc-200">{message}</p> : null}
    </div>
  );
}
