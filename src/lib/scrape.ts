import * as cheerio from "cheerio";

export type ScrapedArticle = {
  title: string;
  contentHtml: string;
  thumbnailUrl: string | null;
};

const CONTENT_SELECTORS = ["article", "main article", "main", ".post-content", ".entry-content", "#content"];

export async function scrapeArticleFromUrl(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải nội dung từ nguồn: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Tin tức Mu Mới Ra";

  let contentHtml = "";
  for (const selector of CONTENT_SELECTORS) {
    const candidate = $(selector).first();
    if (candidate.length) {
      contentHtml = candidate.html()?.trim() ?? "";
      if (contentHtml.length > 200) break;
    }
  }

  if (!contentHtml) {
    contentHtml = $("body").html()?.trim() ?? "";
  }

  if (!contentHtml) {
    throw new Error("Không trích xuất được nội dung bài viết.");
  }

  const thumbnailUrl =
    $("meta[property='og:image']").attr("content")?.trim() ||
    $("article img, main img, img").first().attr("src")?.trim() ||
    null;

  return {
    title,
    contentHtml,
    thumbnailUrl,
  };
}
