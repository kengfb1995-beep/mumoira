import { NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf } from "@/lib/csrf";
import { rewriteArticleToSeoHtml } from "@/lib/gemma-rewrite";
import { getSession } from "@/lib/session";

const schema = z.object({
  title: z.string().min(3),
  sourceHtml: z.string().min(30),
  sourceUrl: z.string().url(),
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

    const rewritten = await rewriteArticleToSeoHtml({
      title: payload.title,
      sourceHtml: payload.sourceHtml,
      sourceUrl: payload.sourceUrl,
    });

    return NextResponse.json({
      title: rewritten.title,
      excerpt: rewritten.excerpt,
      html: rewritten.html,
      seoKeywords: rewritten.seoKeywords,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "AI viết lại thất bại" },
      { status: 500 },
    );
  }
}
