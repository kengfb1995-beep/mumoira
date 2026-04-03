import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { servers, transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const CREATE_SERVER_FEE = 5000;

const createServerSchema = z.object({
  name: z.string().min(3).max(120),
  version: z.string().min(1).max(30),
  exp: z.string().min(1).max(30),
  drop: z.string().min(1).max(30),
  websiteUrl: z.url(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  openBetaDate: z.string().min(16),
  alphaTestDate: z.string().min(16),
});

const updateDateSchema = z.object({
  id: z.number().int().positive(),
  openBetaDate: z.string().min(16),
  alphaTestDate: z.string().min(16),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const ip = getClientIp(req);

    const guard = enforceRateLimit({
      key: `servers:create:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const body = createServerSchema.parse(await req.json());
    const db = getDb();

    const foundUser = await db
      .select({ id: users.id, balance: users.balance })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = foundUser[0];
    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    if (user.balance < CREATE_SERVER_FEE) {
      return NextResponse.json({ message: "Số dư không đủ, cần tối thiểu 5.000đ để đăng server" }, { status: 400 });
    }

    const inserted = await db
      .insert(servers)
      .values({
        userId: session.userId,
        name: body.name,
        version: body.version,
        exp: body.exp,
        drop: body.drop,
        websiteUrl: body.websiteUrl,
        bannerUrl: body.bannerUrl || null,
        openBetaDate: new Date(body.openBetaDate),
        alphaTestDate: new Date(body.alphaTestDate),
        status: "pending",
      })
      .returning({ id: servers.id, name: servers.name });

    await db
      .update(users)
      .set({ balance: sql`${users.balance} - ${CREATE_SERVER_FEE}` })
      .where(eq(users.id, session.userId));

    await db.insert(transactions).values({
      userId: session.userId,
      amount: -CREATE_SERVER_FEE,
      status: "success",
      serviceType: "topup",
      referenceId: inserted[0]?.id,
      description: "Phí đăng server mới (5.000đ)",
    });

    return NextResponse.json({ ok: true, server: inserted[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ message: "Tạo server thất bại" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const body = updateDateSchema.parse(await req.json());
    const db = getDb();

    const found = await db
      .select({ id: servers.id })
      .from(servers)
      .where(and(eq(servers.id, body.id), eq(servers.userId, session.userId)))
      .limit(1);

    if (!found[0]) {
      return NextResponse.json({ message: "Không tìm thấy server của bạn" }, { status: 404 });
    }

    await db
      .update(servers)
      .set({
        openBetaDate: new Date(body.openBetaDate),
        alphaTestDate: new Date(body.alphaTestDate),
      })
      .where(eq(servers.id, body.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ message: "Cập nhật ngày Open/Alpha thất bại" }, { status: 500 });
  }
}
