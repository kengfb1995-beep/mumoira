import { NextResponse } from "next/server";
import { z } from "zod";
import { posts } from "@/db/schema";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { rewriteArticleToSeoHtml } from "@/lib/groq-rewrite";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { scrapeArticleFromUrl } from "@/lib/scrape";
import { getSession } from "@/lib/session";

const schema = z.object({
  url: z.url(),
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
    if (!session || session.role !== "admin") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const payload = schema.parse(await req.json());
    const scraped = await scrapeArticleFromUrl(payload.url);
    const rewrittenHtml = await rewriteArticleToSeoHtml({
      title: scraped.title,
      sourceHtml: scraped.contentHtml,
      sourceUrl: payload.url,
    });

    const sanitizedHtml = sanitizeArticleHtml(rewrittenHtml);
    const db = getDb();
    const inserted = await db
      .insert(posts)
      .values({
        title: scraped.title,
        content: sanitizedHtml,
        originalUrl: payload.url,
        thumbnailUrl: scraped.thumbnailUrl,
      })
      .returning({ id: posts.id, title: posts.title });

    await logAdminAudit({
      adminUserId: session.userId,
      action: "IMPORT_POST",
      targetType: "posts",
      targetId: inserted[0]?.id,
      payload: { sourceUrl: payload.url, title: inserted[0]?.title },
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
