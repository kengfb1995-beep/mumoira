import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { banners, servers, transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { SERVICE_PRICING, type ServiceType } from "@/lib/pricing";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const purchaseSchema = z.object({
  serviceType: z.enum([
    "vip_gold",
    "vip_silver",
    "banner_left_sidebar",
    "banner_right_sidebar",
    "banner_center_top",
    "banner_center_mid",
    "banner_center_bottom",
  ]),
  serverId: z.number().int().positive().optional(),
  imageUrl: z.url().optional(),
  targetUrl: z.url().optional(),
});

function mapBannerPosition(serviceType: ServiceType) {
  if (serviceType === "banner_left_sidebar") return "left_sidebar";
  if (serviceType === "banner_right_sidebar") return "right_sidebar";
  if (serviceType === "banner_center_top") return "center_top";
  if (serviceType === "banner_center_mid") return "center_mid";
  return "center_bottom";
}

function isBannerService(serviceType: ServiceType) {
  return serviceType.startsWith("banner_");
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const ip = getClientIp(req);

    const guard = enforceRateLimit({
      key: `service:purchase:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const payload = purchaseSchema.parse(await req.json());
    const db = getDb();

    const price = SERVICE_PRICING[payload.serviceType];
    const currentUser = await db
      .select({ id: users.id, balance: users.balance })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = currentUser[0];
    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    if (user.balance < price) {
      return NextResponse.json({ message: "Số dư không đủ để mua dịch vụ" }, { status: 400 });
    }

    let referenceId: number | undefined;

    if (payload.serviceType === "vip_gold" || payload.serviceType === "vip_silver") {
      if (!payload.serverId) {
        return NextResponse.json({ message: "Thiếu serverId cho gói VIP" }, { status: 400 });
      }

      const foundServer = await db
        .select({ id: servers.id, userId: servers.userId })
        .from(servers)
        .where(and(eq(servers.id, payload.serverId), eq(servers.userId, session.userId)))
        .limit(1);

      const server = foundServer[0];
      if (!server) {
        return NextResponse.json({ message: "Server không tồn tại hoặc không thuộc quyền sở hữu" }, { status: 404 });
      }

      await db
        .update(servers)
        .set({ vipPackageType: payload.serviceType, status: "active" })
        .where(eq(servers.id, server.id));

      referenceId = server.id;
    }

    if (isBannerService(payload.serviceType)) {
      if (!payload.imageUrl || !payload.targetUrl) {
        return NextResponse.json({ message: "Thiếu imageUrl/targetUrl cho gói banner" }, { status: 400 });
      }

      const now = Date.now();
      const end = now + 7 * 24 * 60 * 60 * 1000;
      const inserted = await db
        .insert(banners)
        .values({
          userId: session.userId,
          position: mapBannerPosition(payload.serviceType),
          imageUrl: payload.imageUrl,
          targetUrl: payload.targetUrl,
          startDate: new Date(now),
          endDate: new Date(end),
          status: "pending",
        })
        .returning({ id: banners.id });

      referenceId = inserted[0]?.id;
    }

    await db
      .update(users)
      .set({ balance: sql`${users.balance} - ${price}` })
      .where(eq(users.id, session.userId));

    await db.insert(transactions).values({
      userId: session.userId,
      amount: -price,
      status: "success",
      serviceType: payload.serviceType,
      referenceId,
      description: `Mua dịch vụ ${payload.serviceType}`,
    });

    return NextResponse.json({ ok: true, price, referenceId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ message: "Mua dịch vụ thất bại" }, { status: 500 });
  }
}
