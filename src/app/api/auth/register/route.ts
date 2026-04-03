import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const guard = enforceRateLimit({
      key: `auth:register:${ip}`,
      limit: 6,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    const body = registerSchema.parse(await req.json());
    const db = getDb();

    const created = await db
      .insert(users)
      .values({
        email: body.email.toLowerCase(),
        passwordHash: hashPassword(body.password),
        role: "user",
        balance: 5000,
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    const user = created[0];
    if (!user) {
      return NextResponse.json({ message: "Không thể tạo tài khoản" }, { status: 500 });
    }

    await createSession({ userId: user.id, email: user.email, role: user.role });
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ message: "Đăng ký thất bại" }, { status: 500 });
  }
}
