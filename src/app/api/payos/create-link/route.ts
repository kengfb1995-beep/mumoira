import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getPayOSClient } from "@/lib/payos";
import { getSession } from "@/lib/session";

const createLinkSchema = z.object({
  amount: z.number().int().min(10000),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const { amount } = createLinkSchema.parse(await req.json());

    const db = getDb();
    const orderCode = Number(`${Date.now().toString().slice(-10)}${session.userId.toString().slice(-2)}`);
    const txDescription = `PAYOS_ORDER:${orderCode}`;

    await db.insert(transactions).values({
      userId: session.userId,
      amount,
      status: "pending",
      serviceType: "topup",
      description: txDescription,
    });

    const payos = await getPayOSClient();
    const checkout = await payos.paymentRequests.create({
      orderCode,
      amount,
      description: `Nap ${session.userId}`.slice(0, 25),
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/nap-tien?status=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/nap-tien?status=cancel`,
    });

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      qrCode: checkout.qrCode ?? (checkout as { qrCodeText?: string }).qrCodeText ?? null,
      orderCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : "Không rõ nguyên nhân";
    return NextResponse.json(
      {
        message: "Không thể tạo link thanh toán",
        detail: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
