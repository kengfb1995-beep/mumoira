import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getBotConfig, testBotNotification } from "@/lib/bot-notify";
import { upsertSecureSetting } from "@/lib/secure-settings";
import { getSession } from "@/lib/session";

const botSchema = z.object({
  telegramBotToken: z.string().trim().optional(),
  telegramChatId: z.string().trim().optional(),
  webhookUrl: z.string().trim().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const config = await getBotConfig();
    return NextResponse.json({
      telegramBotToken: config.telegramBotToken ? "••••••••" + config.telegramBotToken.slice(-6) : "",
      telegramChatId: config.telegramChatId ?? "",
      webhookUrl: config.webhookUrl ?? "",
      hasToken: Boolean(config.telegramBotToken),
    });
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
      key: `admin:settings:bot:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!guard.allowed) return rateLimitResponse(guard.retryAfterMs);

    const body = botSchema.parse(await req.json());

    const tasks: Promise<void>[] = [];
    if (body.telegramBotToken !== undefined && !body.telegramBotToken.startsWith("••••")) {
      tasks.push(upsertSecureSetting("TELEGRAM_BOT_TOKEN", body.telegramBotToken));
    }
    if (body.telegramChatId !== undefined) {
      tasks.push(upsertSecureSetting("TELEGRAM_CHAT_ID", body.telegramChatId));
    }
    if (body.webhookUrl !== undefined) {
      tasks.push(upsertSecureSetting("NOTIFY_WEBHOOK_URL", body.webhookUrl));
    }

    await Promise.all(tasks);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_SETTING",
      targetType: "settings",
      targetId: "BOT_CONFIG",
      payload: {
        hasTelegramToken: Boolean(body.telegramBotToken),
        telegramChatId: body.telegramChatId ?? null,
        hasWebhook: Boolean(body.webhookUrl),
      },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, message: "Đã lưu cấu hình Bot thông báo thành công" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể lưu cấu hình Bot" }, { status: 500 });
  }
}

/**
 * PUT: Test gửi tin nhắn thử nghiệm tới Bot / Webhook Server
 */
export async function PUT(req: Request) {
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

    const result = await testBotNotification();
    return NextResponse.json({
      ok: true,
      result,
      message:
        result.telegram || result.webhook
          ? "Đã gửi thông báo thử nghiệm thành công!"
          : "Không thể gửi tin nhắn. Vui lòng kiểm tra lại Bot Token, Chat ID hoặc Webhook URL.",
    });
  } catch {
    return NextResponse.json({ message: "Lỗi kiểm tra Bot" }, { status: 500 });
  }
}
