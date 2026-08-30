import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getBankConfig } from "@/lib/bank-config";
import { upsertSecureSetting } from "@/lib/secure-settings";
import { getSession } from "@/lib/session";

const bankSchema = z.object({
  bankCode: z.string().trim().min(2, "Mã ngân hàng không hợp lệ"),
  accountNumber: z.string().trim().min(5, "Số tài khoản không hợp lệ"),
  accountName: z.string().trim().min(2, "Tên chủ tài khoản không hợp lệ"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const config = await getBankConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

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
      key: `admin:settings:bank:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!guard.allowed) return rateLimitResponse(guard.retryAfterMs);

    const body = bankSchema.parse(await req.json());

    await Promise.all([
      upsertSecureSetting("BANK_CODE", body.bankCode.toUpperCase()),
      upsertSecureSetting("BANK_ACCOUNT_NUMBER", body.accountNumber),
      upsertSecureSetting("BANK_ACCOUNT_NAME", body.accountName.toUpperCase()),
    ]);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_SETTING",
      targetType: "settings",
      targetId: "BANK_CONFIG",
      payload: {
        bankCode: body.bankCode.toUpperCase(),
        accountNumber: body.accountNumber,
        accountName: body.accountName.toUpperCase(),
      },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, message: "Đã lưu cấu hình ngân hàng VietQR thành công" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể lưu cấu hình ngân hàng" }, { status: 500 });
  }
}
