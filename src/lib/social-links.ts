/** Chuẩn hóa URL cho nút nổi Facebook / Zalo (admin SEO). */

export function normalizeFacebookHref(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

export function normalizeZaloHref(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const digits = t.replace(/\s/g, "");
  if (/^\+?\d[\d\s-]{7,}$/.test(digits)) {
    const n = digits.replace(/\D/g, "");
    return n ? `https://zalo.me/${n}` : null;
  }
  return `https://zalo.me/${encodeURIComponent(t)}`;
}
