/** Chỉ cho phép đường dẫn nội bộ tương đối, tránh open redirect. */
export function safeInternalPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
