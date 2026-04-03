import * as cheerio from "cheerio";

const ALLOWED_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "br",
  "hr",
  "code",
  "pre",
  "span",
  "div",
]);

export function sanitizeArticleHtml(inputHtml: string) {
  const $ = cheerio.load(inputHtml);

  $("script, style, iframe, object, embed, form, input, button, textarea").remove();

  $("*").each((_, el) => {
    const node = el as { tagName?: string; attribs?: Record<string, string> };
    const tagName = (node.tagName || "").toLowerCase();

    if (tagName && !ALLOWED_TAGS.has(tagName)) {
      $(el).replaceWith($(el).text());
      return;
    }

    const attribs = { ...(node.attribs ?? {}) };
    Object.keys(attribs).forEach((attrName) => {
      const value = attribs[attrName] ?? "";
      const lowerAttr = attrName.toLowerCase();

      if (lowerAttr.startsWith("on")) {
        $(el).removeAttr(attrName);
        return;
      }

      if (lowerAttr === "style") {
        $(el).removeAttr(attrName);
        return;
      }

      if ((lowerAttr === "src" || lowerAttr === "href") && /^javascript:/i.test(value)) {
        $(el).removeAttr(attrName);
      }
    });
  });

  $("img").each((_, el) => {
    const img = $(el);
    if (!img.attr("alt")) {
      img.attr("alt", "Mu Mới Ra - Mu Private");
    }
  });

  return $("body").html()?.trim() ?? "";
}
