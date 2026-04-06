import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getSeoConfig } from "@/lib/seo";
import { upsertSecureSetting } from "@/lib/secure-settings";

export async function GET() {
  let session;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
  }
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
  }

  try {
    const seo = await getSeoConfig();
    return NextResponse.json({
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      ogImageUrl: seo.ogImage,
      author: seo.author,
      email: seo.email,
      phone: seo.phone,
      facebook: seo.social.facebook ?? "",
      youtube: seo.social.youtube ?? "",
      zalo: seo.social.zalo ?? "",
    });
  } catch {
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

const payloadSchema = z.object({
  title: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
  keywords: z.string().max(1000).optional().or(z.literal("")),
  ogImageUrl: z.string().max(2000000).optional().or(z.literal("")),
  author: z.string().max(100).optional().or(z.literal("")),
  email: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  facebook: z.string().max(500).optional().or(z.literal("")),
  youtube: z.string().max(500).optional().or(z.literal("")),
  zalo: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    let session;
    try {
      session = await getSession();
    } catch {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const guard = enforceRateLimit({
      key: `admin:seo:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!guard.allowed) return rateLimitResponse(guard.retryAfterMs);

    const body = payloadSchema.parse(await req.json());

    if (body.title !== undefined) await upsertSecureSetting("SEO_SITE_TITLE", body.title);
    if (body.description !== undefined) await upsertSecureSetting("SEO_SITE_DESCRIPTION", body.description);
    if (body.keywords !== undefined) await upsertSecureSetting("SEO_SITE_KEYWORDS", body.keywords);
    if (body.ogImageUrl !== undefined) await upsertSecureSetting("SEO_OG_IMAGE_URL", body.ogImageUrl);
    if (body.author !== undefined) await upsertSecureSetting("SEO_SITE_AUTHOR", body.author);
    if (body.email !== undefined) await upsertSecureSetting("SEO_SITE_EMAIL", body.email);
    if (body.phone !== undefined) await upsertSecureSetting("SEO_SITE_PHONE", body.phone);

    if (body.facebook !== undefined || body.youtube !== undefined || body.zalo !== undefined) {
      const social = JSON.stringify({
        facebook: body.facebook ?? "",
        youtube: body.youtube ?? "",
        zalo: body.zalo ?? "",
      });
      await upsertSecureSetting("SEO_SOCIAL_LINKS", social);
    }

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_SEO",
      targetType: "settings",
      targetId: "seo",
      payload: { fields: Object.keys(body) },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi khi lưu SEO" }, { status: 500 });
  }
}
