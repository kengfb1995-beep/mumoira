import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import * as cheerio from "cheerio";

const previewSchema = z.object({
  url: z.string().url(),
});

export async function POST(req: Request) {
  try {
    let session;
    try {
      session = await getSession();
    } catch {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { url } = previewSchema.parse(await req.json());

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    } catch (e) {
      return NextResponse.json(
        { message: `Không thể truy cập URL. Kiểm tra lại địa chỉ hoặc site nguồn có cho phép fetch.` },
        { status: 400 },
      );
    }

    if (!response.ok) {
      return NextResponse.json({ message: `Không thể truy cập URL (status: ${response.status})` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer, header, aside
    $("script, style, nav, footer, header, aside, noscript, iframe, form").remove();

    // Extract title
    const title = $("h1").first().text().trim()
      || $("h2").first().text().trim()
      || $("title").text().trim()
      || "";

    // Extract main content - try common article containers
    const articleSelectors = [
      "article",
      "[role='main']",
      "main",
      ".post-content",
      ".article-content",
      ".entry-content",
      ".content",
      "#content",
    ];

    let content = "";
    const baseUrl = new URL(url);

    for (const sel of articleSelectors) {
      const el = $(sel);
      if (el.length) {
        // Resolve relative URLs in images
        el.find("img").each((_, img) => {
          const src = $(img).attr("src");
          if (src && !src.startsWith("http") && !src.startsWith("data:")) {
            try {
              $(img).attr("src", new URL(src, baseUrl.origin).toString());
            } catch {}
          }
        });
        content = el.html() || "";
        break;
      }
    }

    if (!content) {
      // Fallback: get body text
      const body = $("body");
      body.find("img").each((_, img) => {
        const src = $(img).attr("src");
        if (src && !src.startsWith("http") && !src.startsWith("data:")) {
          try {
            $(img).attr("src", new URL(src, baseUrl.origin).toString());
          } catch {}
        }
      });
      content = body.html() || "";
    }

    // Extract image URLs
    const images: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
        images.push(src);
      }
    });

    // Extract meta description
    const description = $("meta[name='description']").attr("content") || "";

    return NextResponse.json({
      title,
      content,
      description,
      images,
      sourceUrl: url,
      preview: {
        title: title.slice(0, 200),
        description: description.slice(0, 300),
        imageCount: images.length,
        contentLength: content.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "URL không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể cào bài. Vui lòng thử lại." }, { status: 500 });
  }
}
