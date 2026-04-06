import { NextResponse } from "next/server";
import { z } from "zod";
import { posts } from "@/db/schema";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { rewriteArticleToSeoHtml } from "@/lib/gemma-rewrite";
import { ensureUniquePostSlug } from "@/lib/post-slug";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { scrapeArticleFromUrl } from "@/lib/scrape";
import { getSession } from "@/lib/session";

const schema = z.object({
  url: z.url(),
  seoKeywords: z.string().trim().min(3, "Vui lòng nhập từ khóa SEO").max(300),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const ip = getClientIp(req);

    const guard = enforceRateLimit({
      key: `admin:import-post:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const payload = schema.parse(await req.json());

    let scraped;
    try {
      scraped = await scrapeArticleFromUrl(payload.url);
    } catch (e) {
      return NextResponse.json(
        { message: `Lỗi cào bài: ${e instanceof Error ? e.message : "Không truy cập được URL"}` },
        { status: 500 },
      );
    }

    let rewritten;
    try {
      rewritten = await rewriteArticleToSeoHtml({
        title: scraped.title,
        sourceHtml: scraped.contentHtml,
        sourceUrl: payload.url,
      });
    } catch (e) {
      return NextResponse.json(
        { message: `Lỗi AI viết lại: ${e instanceof Error ? e.message : "Gemma không trả lời"}` },
        { status: 500 },
      );
    }

    const finalSeoKeywords = payload.seoKeywords?.trim() || rewritten.seoKeywords;
    const sanitizedHtml = sanitizeArticleHtml(rewritten.html);
    const db = getDb();

    const finalSlug = await ensureUniquePostSlug({
      db,
      title: scraped.title,
    });

    const inserted = await db
      .insert(posts)
      .values({
        title: scraped.title,
        slug: finalSlug,
        content: sanitizedHtml,
        seoKeywords: finalSeoKeywords,
        originalUrl: payload.url,
        thumbnailUrl: scraped.thumbnailUrl,
      })
      .returning({ id: posts.id, title: posts.title, slug: posts.slug });

    await logAdminAudit({
      adminUserId: session.userId,
      action: "IMPORT_POST",
      targetType: "posts",
      targetId: inserted[0]?.id,
      payload: { sourceUrl: payload.url, title: inserted[0]?.title, seoKeywords: finalSeoKeywords },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, post: inserted[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Import bài viết thất bại",
      },
      { status: 500 },
    );
  }
}
