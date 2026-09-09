import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { banners } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAccountBanners } from "@/lib/account-queries";

const updateMyBannerSchema = z.object({
  id: z.number().int().positive(),
  imageUrl: z.string().refine((v) => /^https?:\/\/.+/.test(v), "Link ảnh phải bắt đầu bằng http:// hoặc https://"),
  targetUrl: z.string().refine((v) => /^https?:\/\/.+/.test(v), "Link đích phải bắt đầu bằng http:// hoặc https://"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }
    const myBanners = await getAccountBanners(session.userId);
    return NextResponse.json({ banners: myBanners });
  } catch {
    return NextResponse.json({ message: "Lỗi tải danh sách banner" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const body = updateMyBannerSchema.parse(await req.json());
    const db = getDb();

    const found = await db
      .select({ id: banners.id })
      .from(banners)
      .where(and(eq(banners.id, body.id), eq(banners.userId, session.userId)))
      .limit(1);

    if (!found[0]) {
      return NextResponse.json({ message: "Không tìm thấy banner của bạn hoặc không có quyền" }, { status: 404 });
    }

    await db
      .update(banners)
      .set({
        imageUrl: body.imageUrl.trim(),
        targetUrl: body.targetUrl.trim(),
        updatedAt: new Date(),
      })
      .where(eq(banners.id, body.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Cập nhật banner thất bại" }, { status: 500 });
  }
}
