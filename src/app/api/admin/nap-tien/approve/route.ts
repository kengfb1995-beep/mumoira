import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { sendDepositApprovedNotification } from "@/lib/bot-notify";

const approveSchema = z.object({
  transactionId: z.number().int().positive("ID giao dịch không hợp lệ"),
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
      key: `admin:topup:approve:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!guard.allowed) return rateLimitResponse(guard.retryAfterMs);

    const body = approveSchema.parse(await req.json());
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
        { message: "Không tìm thấy giao dịch hoặc giao dịch đã được xử lý trước đó" },
        { status: 404 },
      );
    }

    if (tx.amount <= 0) {
      return NextResponse.json({ message: "Số tiền giao dịch không hợp lệ" }, { status: 400 });
    }

    // 1. Cập nhật trạng thái giao dịch sang success
    await db
      .update(transactions)
      .set({ status: "success" })
      .where(eq(transactions.id, tx.id));

    // 2. Cộng số dư tài khoản người dùng
    await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${tx.amount}` })
      .where(eq(users.id, tx.userId));

    // 3. Ghi audit log của admin
    await logAdminAudit({
      adminUserId: session.userId,
      action: "APPROVE_TOPUP",
      targetType: "transactions",
      targetId: String(tx.id),
      payload: {
        transactionId: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        description: tx.description,
        approvedByRole: session.role,
      },
      ipAddress: ip,
    });

    // 4. Lấy thông tin email user và gửi thông báo bot
    const userRows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, tx.userId))
      .limit(1);

    try {
      await sendDepositApprovedNotification({
        orderCode: tx.id,
        userId: tx.userId,
        email: userRows[0]?.email ?? null,
        amount: tx.amount,
        approvedByRole: session.role,
      });
    } catch (err) {
      console.error("[Approve API] Bot notification failed:", err);
    }

    return NextResponse.json({
      ok: true,
      message: `Đã duyệt nạp thành công +${tx.amount.toLocaleString("vi-VN")}đ cho thành viên #${tx.userId}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi xử lý duyệt nạp tiền" }, { status: 500 });
  }
}
