/**
 * Server intro is stored as plain text (textarea) but was rendered via innerHTML,
 * so newlines collapsed and the whole block looked like one paragraph.
 * Escapes markup for safety and maps line breaks to <br />.
 */
export function serverIntroToSafeHtml(raw: string): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\r\n|\r|\n/g, "<br />");
}
