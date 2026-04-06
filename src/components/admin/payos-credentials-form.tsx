"use client";

import { useEffect, useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

type PayOSFields = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  webhookSecret: string;
};

function maskKey(key: string) {
  if (!key || key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(Math.max(0, key.length - 8))}${key.slice(-4)}`;
}

export function PayOSCredentialsForm() {
  const [fields, setFields] = useState<PayOSFields>({
    clientId: "",
    apiKey: "",
    checksumKey: "",
    webhookSecret: "",
  });
  const [showKeys, setShowKeys] = useState<Record<keyof PayOSFields, boolean>>({
    clientId: false,
    apiKey: false,
    checksumKey: false,
    webhookSecret: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const notify = useUiNotify();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keys: (keyof PayOSFields)[] = ["clientId", "apiKey", "checksumKey", "webhookSecret"];
      const settingKeys = ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY", "PAYOS_WEBHOOK_SECRET"];

      const results = await Promise.all(
        settingKeys.map((k) =>
          fetch(`/api/admin/settings/key?key=${k}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => (d as { value?: string } | null)?.value ?? "")
            .catch(() => "")
        )
      );

      if (!cancelled) {
        setFields(
          keys.reduce(
            (acc, key, i) => {
              acc[key] = results[i] ?? "";
              return acc;
            },
            {} as PayOSFields
          )
        );
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function updateField(key: keyof PayOSFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function toggleShow(key: keyof PayOSFields) {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submit() {
    setMessage(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/settings/payos", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(fields),
    });

    const payload = (await res.json()) as { message?: string };
    setSubmitting(false);

    if (!res.ok) {
      const msg = payload.message ?? "Cập nhật thất bại";
      setMessage(msg);
      notify({ type: "error", title: msg });
      return;
    }

    setMessage("Lưu PayOS credentials thành công");
    notify({ type: "success", title: "Đã lưu PayOS credentials" });
  }

  const fieldMeta: Array<{
    key: keyof PayOSFields;
    label: string;
    hint: string;
    placeholder: string;
  }> = [
    {
      key: "clientId",
      label: "Client ID",
      hint: "Lấy từ https://pay.payos.vn → Cài đặt tích hợp",
      placeholder: "Định dạng: xxxxxxxx",
    },
    {
      key: "apiKey",
      label: "API Key",
      hint: "Nằm trong cùng trang cài đặt PayOS",
      placeholder: "pk_...",
    },
    {
      key: "checksumKey",
      label: "Checksum Key",
      hint: "Dùng để xác minh chữ ký webhook từ PayOS",
      placeholder: "Chiều dài ~64 ký tự",
    },
    {
      key: "webhookSecret",
      label: "Webhook Secret",
      hint: "Mật khẩu bảo vệ endpoint webhook (/api/payos/webhook)",
      placeholder: "Đặt một chuỗi ngẫu nhiên mạnh",
    },
  ];

  return (
    <div className="space-y-4">
      {fieldMeta.map(({ key, label, hint, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-amber-200">{label}</label>
            <span className="text-xs text-zinc-500">{hint}</span>
          </div>
          <div className="flex gap-2">
            <input
              type={showKeys[key] ? "text" : "password"}
              value={showKeys[key] ? fields[key] : (fields[key] ? maskKey(fields[key]) : "")}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
              style={{ fontFamily: showKeys[key] ? "monospace" : undefined }}
            />
            <button
              type="button"
              onClick={() => toggleShow(key)}
              className="rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-xs text-zinc-400 hover:text-amber-200"
              title={showKeys[key] ? "Ẩn" : "Hiện"}
            >
              {showKeys[key] ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md border border-red-700/60 bg-red-800/80 px-5 py-2 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Đang lưu..." : "Lưu PayOS Credentials"}
        </button>
        {message ? <span className="text-sm text-emerald-400">{message}</span> : null}
      </div>
    </div>
  );
}
