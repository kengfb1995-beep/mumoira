"use client";

import { useEffect, useState } from "react";
import { Building2, Check, Copy, Save } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

type BankFields = {
  bankCode: string;
  accountNumber: string;
  accountName: string;
};

export function BankSettingsForm() {
  const [fields, setFields] = useState<BankFields>({
    bankCode: "BIDV",
    accountNumber: "8858978570",
    accountName: "NGUYEN THANH PHONG",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/bank");
        if (res.ok) {
          const data = (await res.json()) as { bankCode?: string; accountNumber?: string; accountName?: string };
          if (data.bankCode) {
            setFields({
              bankCode: data.bankCode || "BIDV",
              accountNumber: data.accountNumber || "8858978570",
              accountName: data.accountName || "NGUYEN THANH PHONG",
            });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/admin/settings/bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(fields),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(`❌ ${data.message || "Lỗi lưu cấu hình"}`);
      } else {
        setMessage("✅ Đã lưu thông tin tài khoản ngân hàng VietQR thành công!");
      }
    } catch {
      setMessage("❌ Có lỗi xảy ra khi kết nối server");
    } finally {
      setSubmitting(false);
    }
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (loading) {
    return <p className="text-sm text-zinc-400">Đang tải cấu hình ngân hàng...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="rounded-lg border border-amber-500/30 bg-black/40 p-3 text-sm text-amber-200">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Mã Ngân hàng (VietQR Code) <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.bankCode}
            onChange={(e) => setFields((prev) => ({ ...prev, bankCode: e.target.value.toUpperCase() }))}
            placeholder="BIDV, VCB, MB, TCB..."
            className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 text-sm text-amber-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-500">Mã ngân hàng chuẩn VietQR (ví dụ: BIDV, MB, VCB)</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Số tài khoản <span className="text-red-400">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              required
              value={fields.accountNumber}
              onChange={(e) => setFields((prev) => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="8858978570"
              className="w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 pr-9 font-mono text-sm text-amber-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => copyText(fields.accountNumber, "acc")}
              className="absolute right-2 top-2 text-zinc-400 hover:text-amber-300"
              title="Sao chép"
            >
              {copiedField === "acc" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Số tài khoản nhận chuyển khoản</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Tên chủ tài khoản <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.accountName}
            onChange={(e) => setFields((prev) => ({ ...prev, accountName: e.target.value.toUpperCase() }))}
            placeholder="NGUYEN THANH PHONG"
            className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 text-sm text-amber-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-500">Họ và tên không dấu (in hoa)</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-600/30 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-600/50 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {submitting ? "Đang lưu..." : "Lưu thông tin ngân hàng"}
        </button>
      </div>
    </form>
  );
}
