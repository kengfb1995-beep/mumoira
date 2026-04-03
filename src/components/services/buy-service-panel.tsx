"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useUiNotify } from "@/components/providers/ui-provider";
import { SERVICE_PRICING, type ServiceType } from "@/lib/pricing";

const serviceOptions: { label: string; value: ServiceType }[] = [
  { label: "VIP Vàng", value: "vip_gold" },
  { label: "VIP Bạc", value: "vip_silver" },
  { label: "Banner trái", value: "banner_left_sidebar" },
  { label: "Banner phải", value: "banner_right_sidebar" },
  { label: "Banner giữa top", value: "banner_center_top" },
  { label: "Banner giữa mid", value: "banner_center_mid" },
  { label: "Banner giữa bottom", value: "banner_center_bottom" },
];

function isBannerType(value: ServiceType) {
  return value.startsWith("banner_");
}

export function BuyServicePanel() {
  const notify = useUiNotify();
  const [serviceType, setServiceType] = useState<ServiceType>("vip_gold");
  const [serverId, setServerId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const price = SERVICE_PRICING[serviceType];
  const estimatedBalance = useMemo(() => (balance == null ? null : balance - price), [balance, price]);

  async function refreshBalance() {
    const res = await fetch("/api/me/balance", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { balance: number };
    setBalance(data.balance);
  }

  useEffect(() => {
    void refreshBalance();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);

    if (estimatedBalance != null && estimatedBalance < 0) {
      notify({ type: "error", title: "Số dư không đủ cho giao dịch này" });
      return;
    }

    const ok = window.confirm(`Xác nhận mua ${serviceType} với giá ${price.toLocaleString("vi-VN")}đ?`);
    if (!ok) return;

    setSubmitting(true);

    const payload: {
      serviceType: ServiceType;
      serverId?: number;
      imageUrl?: string;
      targetUrl?: string;
    } = { serviceType };

    if (serviceType === "vip_gold" || serviceType === "vip_silver") {
      payload.serverId = Number(serverId);
    }

    if (isBannerType(serviceType)) {
      payload.imageUrl = imageUrl;
      payload.targetUrl = targetUrl;
    }

    const res = await fetch("/api/services/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      const msg = data.message ?? "Mua dịch vụ thất bại";
      setMessage(msg);
      notify({ type: "error", title: msg });
      await refreshBalance();
      setSubmitting(false);
      return;
    }

    const msg = "Mua dịch vụ thành công. Vui lòng kiểm tra trang tài khoản.";
    setMessage(msg);
    notify({ type: "success", title: msg });
    await refreshBalance();
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-amber-500/20 bg-black/25 p-4">
      <h2 className="text-lg font-semibold text-amber-200">Mua dịch vụ bằng số dư</h2>

      <div className="rounded-lg border border-amber-500/20 bg-black/30 p-3 text-sm text-zinc-200">
        <p>Số dư hiện tại: {balance == null ? "Đang tải..." : `${balance.toLocaleString("vi-VN")}đ`}</p>
        <p>
          Sau giao dịch dự kiến: {estimatedBalance == null ? "..." : `${estimatedBalance.toLocaleString("vi-VN")}đ`}
        </p>
      </div>

      <select
        className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
        value={serviceType}
        onChange={(event) => setServiceType(event.target.value as ServiceType)}
      >
        {serviceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} - {SERVICE_PRICING[option.value].toLocaleString("vi-VN")}đ
          </option>
        ))}
      </select>

      {(serviceType === "vip_gold" || serviceType === "vip_silver") && (
        <input
          placeholder="Server ID của bạn"
          type="number"
          value={serverId}
          onChange={(event) => setServerId(event.target.value)}
          className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
          required
        />
      )}

      {isBannerType(serviceType) && (
        <>
          <input
            placeholder="URL ảnh banner"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="URL đích khi click"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
            required
          />
        </>
      )}

      {estimatedBalance != null && estimatedBalance < 0 ? (
        <p className="text-sm text-red-300">Số dư dự kiến âm. Vui lòng nạp thêm trước khi mua.</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || (estimatedBalance != null && estimatedBalance < 0)}
        className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Đang xử lý..." : "Xác nhận mua dịch vụ"}
      </button>

      {message ? <p className="text-sm text-zinc-200">{message}</p> : null}
    </form>
  );
}
