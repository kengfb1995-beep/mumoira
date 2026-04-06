"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useUi } from "@/components/providers/ui-provider";
import { BANNER_SERVICE_SPECS, type PurchasableBannerService } from "@/lib/banner-config";
import type { BannerSlotSnapshot } from "@/lib/banner-availability";
import { DEFAULT_SERVICE_PRICING_PER_DAY, type ServiceType } from "@/lib/pricing";

const serviceOptions: { label: string; value: ServiceType }[] = [
  { label: "VIP Vàng", value: "vip_gold" },
  { label: "VIP Bạc", value: "vip_silver" },
  { label: "Banner trái", value: "banner_left_sidebar" },
  { label: "Banner phải", value: "banner_right_sidebar" },
  { label: "Banner giữa (lớn, 1 slot)", value: "banner_center_top" },
  { label: "Banner giữa (ngang, 10 slot)", value: "banner_center_mid" },
];

function isBannerType(value: ServiceType): value is PurchasableBannerService {
  return (
    value === "banner_left_sidebar" ||
    value === "banner_right_sidebar" ||
    value === "banner_center_top" ||
    value === "banner_center_mid"
  );
}

type AvailabilityPayload = {
  slots: BannerSlotSnapshot;
  dimensions: typeof BANNER_SERVICE_SPECS;
};

type ApprovedServerOption = {
  id: number;
  name: string;
  status: string;
  vipPackageType: string;
};

export function BuyServicePanel() {
  const { notify, confirm } = useUi();
  const [serviceType, setServiceType] = useState<ServiceType>("vip_gold");
  const [serverId, setServerId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bannerSlots, setBannerSlots] = useState<BannerSlotSnapshot | null>(null);
  const [approvedServers, setApprovedServers] = useState<ApprovedServerOption[]>([]);
  const [loadingApprovedServers, setLoadingApprovedServers] = useState(false);
  const [pricingPerDay, setPricingPerDay] = useState(DEFAULT_SERVICE_PRICING_PER_DAY);
  const [days, setDays] = useState(7);

  const unitPrice = pricingPerDay[serviceType];
  const price = unitPrice * days;
  const estimatedBalance = useMemo(() => (balance == null ? null : balance - price), [balance, price]);

  const bannerSlotFull = isBannerType(serviceType) ? (bannerSlots?.[serviceType]?.full ?? false) : false;

  async function refreshBalance() {
    const res = await fetch("/api/me/balance", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { balance: number };
    setBalance(data.balance);
  }

  async function refreshBannerSlots() {
    const res = await fetch("/api/services/banner-availability", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as AvailabilityPayload;
    setBannerSlots(data.slots);
  }

  async function refreshPricing() {
    const res = await fetch("/api/services/pricing", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { pricing?: typeof DEFAULT_SERVICE_PRICING_PER_DAY };
    if (data.pricing) setPricingPerDay(data.pricing);
  }

  async function refreshApprovedServers() {
    setLoadingApprovedServers(true);
    try {
      const res = await fetch("/api/me/approved-servers", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { servers?: ApprovedServerOption[] };
      setApprovedServers(data.servers ?? []);
    } finally {
      setLoadingApprovedServers(false);
    }
  }

  useEffect(() => {
    void refreshBalance();
    void refreshBannerSlots();
    void refreshApprovedServers();
    void refreshPricing();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);

    if (estimatedBalance != null && estimatedBalance < 0) {
      notify({ type: "error", title: "Số dư không đủ cho giao dịch này" });
      return;
    }

    if (isBannerType(serviceType) && bannerSlotFull) {
      notify({ type: "error", title: "Hết slot" });
      return;
    }

    const serviceLabel = serviceOptions.find((o) => o.value === serviceType)?.label ?? serviceType;
    const ok = await confirm({
      title: "Xác nhận mua dịch vụ",
      description: `Bạn sắp mua ${serviceLabel} trong ${days} ngày với tổng giá ${price.toLocaleString("vi-VN")}đ. Số dư sẽ được trừ ngay sau khi xác nhận.`,
      confirmLabel: "Mua ngay",
      cancelLabel: "Hủy",
    });
    if (!ok) return;

    setSubmitting(true);

    const payload: {
      serviceType: ServiceType;
      days: number;
      serverId?: number;
      imageUrl?: string;
      targetUrl?: string;
    } = { serviceType, days };

    if (serviceType === "vip_gold" || serviceType === "vip_silver") {
      const sid = Number(serverId);
      if (!Number.isFinite(sid) || sid <= 0) {
        notify({ type: "error", title: "Vui lòng chọn server đã được duyệt" });
        setSubmitting(false);
        return;
      }
      payload.serverId = sid;
    }

    if (isBannerType(serviceType)) {
      payload.imageUrl = imageUrl;
      payload.targetUrl = targetUrl;
    } else if (serviceType === "vip_gold") {
      payload.imageUrl = imageUrl;
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
      await refreshBannerSlots();
      setSubmitting(false);
      return;
    }

    const msg = "Mua dịch vụ thành công. Vui lòng kiểm tra trang tài khoản.";
    setMessage(msg);
    notify({ type: "success", title: msg });
    await refreshBalance();
    await refreshBannerSlots();
    setSubmitting(false);
  }

  const spec = isBannerType(serviceType)
    ? BANNER_SERVICE_SPECS[serviceType]
    : serviceType === "vip_gold"
      ? BANNER_SERVICE_SPECS.banner_vip_gold
      : null;
  const slotInfo = isBannerType(serviceType) ? bannerSlots?.[serviceType] : null;

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
        {serviceOptions.map((option) => {
          const full = option.value.startsWith("banner_") && bannerSlots?.[option.value as PurchasableBannerService]?.full;
          return (
            <option key={option.value} value={option.value} disabled={!!full}>
              {option.label} - {pricingPerDay[option.value].toLocaleString("vi-VN")}đ/ngày
              {full ? " — Hết slot" : ""}
            </option>
          );
        })}
      </select>

      <div className="space-y-1">
        <label className="text-sm text-zinc-300">Số ngày sử dụng</label>
        <input
          type="number"
          min={1}
          max={90}
          value={days}
          onChange={(event) => setDays(Math.max(1, Math.min(90, Number(event.target.value) || 1)))}
          className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
        />
        <p className="text-xs text-zinc-400">Đơn giá: {unitPrice.toLocaleString("vi-VN")}đ/ngày · Tổng: {price.toLocaleString("vi-VN")}đ</p>
      </div>

      {spec ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-3 text-sm text-amber-100">
          <p className="font-semibold text-amber-200">Kích thước banner bắt buộc (pixel)</p>
          <p className="mt-1">
            Rộng × cao: <span className="font-mono font-bold">{spec.w} × {spec.h}px</span>
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            Ảnh phải đúng tỷ lệ khung hiển thị trên trang chủ; trang không thu nhỏ banner trên mobile (cuộn ngang nếu màn hẹp).
          </p>
          {slotInfo ? (
            <p className="mt-2 text-xs text-zinc-200">
              Slot: {slotInfo.used}/{slotInfo.limit}
              {slotInfo.full ? <span className="ml-2 font-bold text-red-300">Hết slot</span> : null}
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-400">Đang kiểm tra slot...</p>
          )}
        </div>
      ) : null}

      {(serviceType === "vip_gold" || serviceType === "vip_silver") && (
        <div className="space-y-2">
          <select
            value={serverId}
            onChange={(event) => setServerId(event.target.value)}
            className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
            required
          >
            <option value="" disabled>
              {loadingApprovedServers ? "Đang tải danh sách server đã duyệt..." : "Chọn server đã được duyệt"}
            </option>
            {approvedServers.map((server) => (
              <option key={server.id} value={String(server.id)}>
                #{server.id} - {server.name}
              </option>
            ))}
          </select>
          {!loadingApprovedServers && approvedServers.length === 0 ? (
            <p className="text-xs text-yellow-300">
              Bạn chưa có server nào ở trạng thái active. Hãy chờ duyệt server trước khi mua VIP.
            </p>
          ) : null}
        </div>
      )}

      {(isBannerType(serviceType) || serviceType === "vip_gold") && (
        <>
          <input
            placeholder="Link banner (https://... .jpg/.jpeg/.png/.webp/.gif/.mp4)"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
            required
          />
          <p className="text-xs text-zinc-400">
            Hỗ trợ ảnh và MP4. Video sẽ tự phát, tắt tiếng, lặp lại để hiển thị ổn định trên banner.
          </p>
          {isBannerType(serviceType) && (
            <input
              placeholder="URL đích khi click"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
              required
            />
          )}
        </>
      )}

      {serviceType === "vip_gold" ? (
        <p className="text-xs text-zinc-400">
          VIP Vàng: banner ngang {BANNER_SERVICE_SPECS.banner_vip_gold.w}×{BANNER_SERVICE_SPECS.banner_vip_gold.h}px hiển thị trong danh sách. Hình ảnh sẽ tự động được sử dụng.
        </p>
      ) : null}

      {estimatedBalance != null && estimatedBalance < 0 ? (
        <p className="text-sm text-red-300">Số dư dự kiến âm. Vui lòng nạp thêm trước khi mua.</p>
      ) : null}

      {bannerSlotFull ? <p className="text-sm font-semibold text-red-300">Hết slot — không thể thuê thêm vị trí này.</p> : null}

      <button
        type="submit"
        disabled={submitting || (estimatedBalance != null && estimatedBalance < 0) || bannerSlotFull}
        className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Đang xử lý..." : "Xác nhận mua dịch vụ"}
      </button>

      {message ? <p className="text-sm text-zinc-200">{message}</p> : null}
    </form>
  );
}
