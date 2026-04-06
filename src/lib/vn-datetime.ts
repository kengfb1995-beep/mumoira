/** Luôn dùng giờ Việt Nam (không DST) cho hiển thị & “hôm nay” trên danh sách. */
export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Giá trị cho input datetime-local: wall time tại VN từ instant UTC. */
export function toDatetimeLocalValueVn(value: Date | number | null | undefined): string {
  if (value == null) return "";
  const d = typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const utc = d.getTime();
  const vn = new Date(utc + VN_OFFSET_MS);
  return `${vn.getUTCFullYear()}-${pad2(vn.getUTCMonth() + 1)}-${pad2(vn.getUTCDate())}T${pad2(vn.getUTCHours())}:${pad2(vn.getUTCMinutes())}`;
}

/**
 * Chuỗi từ datetime-local được hiểu là giờ địa phương Việt Nam (UTC+7).
 * Dùng khi parse JSON từ client (YYYY-MM-DDTHH:mm).
 */
export function parseDatetimeLocalAsVietnam(isoLocal: string): Date {
  const m = isoLocal.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return new Date(isoLocal);
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  return new Date(Date.UTC(y, mo, day, h, mi) - VN_OFFSET_MS);
}

export function getCalendarDayMsInVietnam(d: Date): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(y, month - 1, day).getTime();
}

export function isSameCalendarDayVietnam(ts: Date | null, ref: Date = new Date()): boolean {
  if (!ts) return false;
  return getCalendarDayMsInVietnam(new Date(ts)) === getCalendarDayMsInVietnam(ref);
}

/** VD: 06/04/2026 (17h) — theo giờ VN */
export function formatDateTimeShortVietnam(ts: Date | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const day = d.toLocaleDateString("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hour = d.toLocaleString("en-GB", {
    timeZone: VN_TIMEZONE,
    hour: "numeric",
    hour12: false,
  });
  return `${day} (${hour}h)`;
}

export function formatDateTimeFullVietnam(ts: Date): string {
  return new Date(ts).toLocaleString("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Số ngày lịch theo múi VN: 0 = cùng ngày ref, 1 = ngày mai so với ref */
export function calendarDaysFromEventVietnam(ts: Date | null, ref: Date): number | null {
  if (!ts) return null;
  const diff = getCalendarDayMsInVietnam(new Date(ts)) - getCalendarDayMsInVietnam(ref);
  return Math.round(diff / 86_400_000);
}
