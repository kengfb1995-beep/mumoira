/** Kích thước pixel cố định — không thu nhỏ trên mobile (dùng overflow-x-auto). */

/** Giữa lớn — banner trang chủ phía trên (780×280) */
export const BANNER_TOP = { w: 780, h: 280 } as const;
/** Giữa nhỏ — banner giữa trang (780×110) */
export const BANNER_MIDDLE = { w: 780, h: 110 } as const;
/** VIP Vàng — banner ngang trong danh sách (468×68) */
export const BANNER_VIP_GOLD = { w: 468, h: 68 } as const;
/** Trái / Phải — cột sidebar (204×390) */
export const BANNER_SIDE = { w: 204, h: 390 } as const;

export const BANNER_SLOT_LIMITS = {
  center_top: 1,
  /** Banner giữa trang 780×110 */
  center_mid: 10,
  /** Legacy vị trí cũ, gộp chung với center_mid để tránh trùng lặp */
  center_mid_pool: 10,
  left_sidebar: 3,
  right_sidebar: 3,
} as const;

export type PurchasableBannerService =
  | "banner_left_sidebar"
  | "banner_right_sidebar"
  | "banner_center_top"
  | "banner_center_mid"
  | "banner_vip_gold";

export const BANNER_SERVICE_SPECS: Record<
  PurchasableBannerService,
  { w: number; h: number; position: "left_sidebar" | "right_sidebar" | "center_top" | "center_mid" | "vip_gold" }
> = {
  banner_center_top: { ...BANNER_TOP, position: "center_top" },
  banner_center_mid: { ...BANNER_MIDDLE, position: "center_mid" },
  banner_left_sidebar: { ...BANNER_SIDE, position: "left_sidebar" },
  banner_right_sidebar: { ...BANNER_SIDE, position: "right_sidebar" },
  banner_vip_gold: { ...BANNER_VIP_GOLD, position: "vip_gold" },
};
