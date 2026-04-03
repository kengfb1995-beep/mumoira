import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const guard = enforceRateLimit({
      key: `auth:login:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    const body = loginSchema.parse(await req.json());
    const db = getDb();

    const found = await db
      .select({ id: users.id, email: users.email, role: users.role, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()))
      .limit(1);

    const user = found[0];
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    await createSession({ userId: user.id, email: user.email, role: user.role });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ message: "Đăng nhập thất bại" }, { status: 500 });
  }
}
