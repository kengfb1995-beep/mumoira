import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getBankConfig, generateTransferContent, getVietQrUrl } from "@/lib/bank-config";
import { sendDepositNotification } from "@/lib/bot-notify";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

const createDepositSchema = z.object({
  amount: z
    .number()
    .int("Số tiền phải là số nguyên")
    .min(10000, "Số tiền nạp tối thiểu là 10.000 VNĐ")
    .max(100_000_000, "Số tiền nạp tối đa là 100.000.000 VNĐ"),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập để nạp tiền" }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = createDepositSchema.parse(body);

    const db = getDb();
    const bankConfig = await getBankConfig();

    // Sinh mã đơn nạp 6 số ngẫu nhiên kết hợp timestamp
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = Number(`${Date.now().toString().slice(-4)}${randomSuffix}`);
    const transferDescription = generateTransferContent(session.userId, orderCode);

    // Lưu giao dịch ở trạng thái pending
    const [inserted] = await db
      .insert(transactions)
      .values({
        userId: session.userId,
        amount,
        status: "pending",
        serviceType: "topup",
        description: transferDescription,
      })
      .returning({ id: transactions.id });

    // Sinh link VietQR chuẩn
    const qrCodeUrl = getVietQrUrl({
      bankCode: bankConfig.bankCode,
      accountNumber: bankConfig.accountNumber,
      accountName: bankConfig.accountName,
      amount,
      description: transferDescription,
    });

    // Lấy thông tin email user để gửi thông báo bot
    const userRows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    const userEmail = userRows[0]?.email ?? null;

    // Gửi thông báo đến Bot / Server Webhook của Admin (bọc try/catch để không gián đoạn luồng)
    void sendDepositNotification({
      orderCode,
      userId: session.userId,
      email: userEmail,
      amount,
      description: transferDescription,
      bankName: bankConfig.bankName,
      accountNumber: bankConfig.accountNumber,
      accountName: bankConfig.accountName,
    }).catch((err) => {
      console.error("[Deposit API] Send bot notification failed:", err);
    });

    return NextResponse.json({
      success: true,
      transactionId: inserted?.id,
      orderCode,
      amount,
      description: transferDescription,
      qrCodeUrl,
      bankInfo: bankConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Dữ liệu không hợp lệ", issues: error.issues },
        { status: 400 },
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Không rõ nguyên nhân";
    return NextResponse.json(
      {
        message: "Không thể tạo đơn nạp tiền",
        detail: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
