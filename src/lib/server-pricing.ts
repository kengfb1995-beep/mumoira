import type { ServiceType } from "@/lib/pricing";
import { DEFAULT_SERVICE_PRICING_PER_DAY } from "@/lib/pricing";
import { getSecureSetting } from "@/lib/secure-settings";

export async function getServicePricingPerDay(): Promise<Record<ServiceType, number>> {
  try {
    const raw = await getSecureSetting("SERVICE_PRICING_PER_DAY_JSON");
    if (!raw) return DEFAULT_SERVICE_PRICING_PER_DAY;

    const parsed = JSON.parse(raw) as Partial<Record<ServiceType, number>>;
    return {
      vip_gold: Number(parsed.vip_gold ?? DEFAULT_SERVICE_PRICING_PER_DAY.vip_gold),
      vip_silver: Number(parsed.vip_silver ?? DEFAULT_SERVICE_PRICING_PER_DAY.vip_silver),
      banner_left_sidebar: Number(parsed.banner_left_sidebar ?? DEFAULT_SERVICE_PRICING_PER_DAY.banner_left_sidebar),
      banner_right_sidebar: Number(parsed.banner_right_sidebar ?? DEFAULT_SERVICE_PRICING_PER_DAY.banner_right_sidebar),
      banner_center_top: Number(parsed.banner_center_top ?? DEFAULT_SERVICE_PRICING_PER_DAY.banner_center_top),
      banner_center_mid: Number(parsed.banner_center_mid ?? DEFAULT_SERVICE_PRICING_PER_DAY.banner_center_mid),
    };
  } catch {
    return DEFAULT_SERVICE_PRICING_PER_DAY;
  }
}
