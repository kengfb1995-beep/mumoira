"use client";

import { useEffect, useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";
import { DEFAULT_SERVICE_PRICING_PER_DAY, type ServiceType } from "@/lib/pricing";

const labels: Record<ServiceType, string> = {
  vip_gold: "VIP Vàng",
  vip_silver: "VIP Bạc",
  banner_left_sidebar: "Banner trái",
  banner_right_sidebar: "Banner phải",
  banner_center_top: "Banner giữa lớn",
  banner_center_mid: "Banner giữa ngang",
};

export function ServicePricingForm() {
  const notify = useUiNotify();
  const [pricing, setPricing] = useState<Record<ServiceType, number>>(DEFAULT_SERVICE_PRICING_PER_DAY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings/pricing", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { pricing?: Record<ServiceType, number> };
      if (data.pricing) setPricing(data.pricing);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/settings/pricing", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(pricing),
    });

    setSaving(false);
    if (!res.ok) {
      notify({ type: "error", title: "Lưu giá dịch vụ thất bại" });
      return;
    }

    notify({ type: "success", title: "Đã lưu giá dịch vụ theo ngày" });
  }

  return (
    <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
      <h2 className="text-lg font-semibold text-amber-200">Giá dịch vụ theo ngày</h2>
      <p className="mt-1 text-xs text-zinc-400">Admin có thể chỉnh đơn giá/ngày cho từng dịch vụ.</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {(Object.keys(labels) as ServiceType[]).map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-sm text-zinc-300">{labels[key]} (đ/ngày)</label>
            <input
              type="number"
              min={1}
              value={pricing[key]}
              onChange={(e) =>
                setPricing((prev) => ({
                  ...prev,
                  [key]: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60"
      >
        {saving ? "Đang lưu..." : "Lưu cấu hình giá"}
      </button>
    </section>
  );
}
