import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const rejectSchema = z.object({
  transactionId: z.number().int().positive("ID giao dịch không hợp lệ"),
  reason: z.string().trim().max(300).optional(),
});

export async function POST(req: Request) {
  try {
    let session;
    try {
      session = await getSession();
    } catch {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const guard = enforceRateLimit({
      key: `admin:topup:reject:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!guard.allowed) return rateLimitResponse(guard.retryAfterMs);

    const body = rejectSchema.parse(await req.json());
    const db = getDb();

    // Tìm giao dịch nạp tiền đang ở trạng thái pending
    const [tx] = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        status: transactions.status,
        description: transactions.description,
      })
      .from(transactions)
      .where(and(eq(transactions.id, body.transactionId), eq(transactions.status, "pending")))
      .limit(1);

    if (!tx) {
      return NextResponse.json(
        { message: "Không tìm thấy giao dịch hoặc giao dịch đã được xử lý" },
        { status: 404 },
      );
    }

    // Cập nhật trạng thái giao dịch sang cancelled
    await db
      .update(transactions)
      .set({
        status: "cancelled",
        description: body.reason
          ? `${tx.description ?? ""} [Từ chối: ${body.reason}]`.trim()
          : tx.description,
      })
      .where(eq(transactions.id, tx.id));

    // Ghi audit log
    await logAdminAudit({
      adminUserId: session.userId,
      action: "REJECT_TOPUP",
      targetType: "transactions",
      targetId: String(tx.id),
      payload: {
        transactionId: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        reason: body.reason ?? null,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      ok: true,
      message: `Đã từ chối đơn nạp #${tx.id}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi xử lý từ chối đơn nạp" }, { status: 500 });
  }
}
