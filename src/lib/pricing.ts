export const SERVICE_PRICING = {
  vip_gold: 500000,
  vip_silver: 300000,
  banner_left_sidebar: 400000,
  banner_right_sidebar: 400000,
  banner_center_top: 700000,
  banner_center_mid: 600000,
  banner_center_bottom: 500000,
} as const;

export type ServiceType =
  | "vip_gold"
  | "vip_silver"
  | "banner_left_sidebar"
  | "banner_right_sidebar"
  | "banner_center_top"
  | "banner_center_mid"
  | "banner_center_bottom";
