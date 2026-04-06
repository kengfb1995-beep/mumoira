import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const adjustSchema = z.object({
  userId: z.number().int().positive(),
  amount: z
    .number()
    .int("Số tiền phải là số nguyên")
    .min(1000, "Tối thiểu 1.000đ")
    .max(1_000_000_000, "Tối đa 1.000.000.000đ mỗi lần"),
  action: z.enum(["add", "subtract"]),
  description: z.string().trim().min(1, "Nhập lý do (ít nhất 1 ký tự)").max(500, "Lý do tối đa 500 ký tự"),
});

export async function PATCH(req: Request) {
  try {
    let session;
    try {
      session = await getSession();
    } catch {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const guard = enforceRateLimit({
      key: `admin:balance:${ip}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!guard.allowed) return rateLimitResponse(guard.retryAfterMs);

    const body = adjustSchema.parse(await req.json());
    const db = getDb();

    // Find user
    const [target] = await db.select({ id: users.id, balance: users.balance }).from(users).where(eq(users.id, body.userId)).limit(1);
    if (!target) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const newBalance = body.action === "add"
      ? target.balance + body.amount
      : target.balance - body.amount;

    if (newBalance < 0) {
      return NextResponse.json({ message: "Số dư không thể âm" }, { status: 400 });
    }

    // Update balance
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, body.userId));

    // Log transaction
    await db.insert(transactions).values({
      userId: body.userId,
      amount: body.action === "add" ? body.amount : -body.amount,
      status: "success",
      serviceType: "topup",
      description: `[Admin ${session.role}] ${body.description}`,
    });

    await logAdminAudit({
      adminUserId: session.userId,
      action: "ADJUST_BALANCE",
      targetType: "users",
      targetId: String(body.userId),
      payload: { action: body.action, amount: body.amount, newBalance, description: body.description },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, newBalance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
