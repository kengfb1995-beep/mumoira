import { NextResponse } from "next/server";
import { z } from "zod";
import { posts } from "@/db/schema";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { ensureUniquePostSlug } from "@/lib/post-slug";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { getSession } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(3).max(220),
  slug: z.string().trim().min(3).max(240).optional(),
  excerpt: z.string().trim().max(600).optional(),
  contentHtml: z.string().trim().min(30),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  originalUrl: z.string().url().optional().or(z.literal("")),
  seoKeywords: z.string().trim().max(500).optional(),
  author: z.string().max(100).optional(),
  tags: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  isHot: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["published", "draft"]).optional(),
  innerImages: z.string().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  giftcodeGameId: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const payload = schema.parse(await req.json());
    const db = getDb();

    const finalSlug = payload.slug?.trim()
      ? await ensureUniquePostSlug({ db, title: payload.slug.trim() })
      : await ensureUniquePostSlug({ db, title: payload.title });

    const sanitizedHtml = sanitizeArticleHtml(payload.contentHtml);

    const inserted = await db
      .insert(posts)
      .values({
        title: payload.title,
        slug: finalSlug,
        content: sanitizedHtml,
        seoKeywords: payload.seoKeywords || "",
        originalUrl: payload.originalUrl || null,
        thumbnailUrl: payload.thumbnailUrl?.trim() || null,
        author: payload.author || "",
        tags: payload.tags || "",
        category: payload.category || "",
        isHot: payload.isHot || false,
        isFeatured: payload.isFeatured || false,
        status: payload.status || "published",
        innerImages: payload.innerImages || null,
        seoTitle: payload.seoTitle || null,
        seoDescription: payload.seoDescription || null,
        giftcodeGameId: payload.giftcodeGameId || null,
      })
      .returning({ id: posts.id, title: posts.title, slug: posts.slug });

    await logAdminAudit({
      adminUserId: session.userId,
      action: "IMPORT_POST",
      targetType: "posts",
      targetId: inserted[0]?.id,
      payload: {
        sourceUrl: payload.originalUrl,
        title: payload.title,
        slug: finalSlug,
        excerpt: payload.excerpt,
      },
    });

    return NextResponse.json({ ok: true, post: inserted[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể lưu bài" },
      { status: 500 },
    );
  }
}
