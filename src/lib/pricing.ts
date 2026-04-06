export type ServiceType =
  | "vip_gold"
  | "vip_silver"
  | "banner_left_sidebar"
  | "banner_right_sidebar"
  | "banner_center_top"
  | "banner_center_mid";

export const DEFAULT_SERVICE_PRICING_PER_DAY: Record<ServiceType, number> = {
  vip_gold: 500000,
  vip_silver: 300000,
  banner_left_sidebar: 400000,
  banner_right_sidebar: 400000,
  banner_center_top: 700000,
  banner_center_mid: 600000,
};
