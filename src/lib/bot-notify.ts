import { getSecureSetting } from "@/lib/secure-settings";
import { formatDateTimeFullVietnam } from "@/lib/vn-datetime";

export type BotConfig = {
  telegramBotToken: string | null;
  telegramChatId: string | null;
  webhookUrl: string | null;
};

/**
 * Lấy cấu hình Bot / Webhook từ database hoặc biến môi trường
 */
export async function getBotConfig(): Promise<BotConfig> {
  try {
    const [token, chatId, webhook] = await Promise.all([
      getSecureSetting("TELEGRAM_BOT_TOKEN"),
      getSecureSetting("TELEGRAM_CHAT_ID"),
      getSecureSetting("NOTIFY_WEBHOOK_URL"),
    ]);

    return {
      telegramBotToken: token?.trim() || process.env.TELEGRAM_BOT_TOKEN || null,
      telegramChatId: chatId?.trim() || process.env.TELEGRAM_CHAT_ID || null,
      webhookUrl: webhook?.trim() || process.env.NOTIFY_WEBHOOK_URL || null,
    };
  } catch {
    return {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || null,
      telegramChatId: process.env.TELEGRAM_CHAT_ID || null,
      webhookUrl: process.env.NOTIFY_WEBHOOK_URL || null,
    };
  }
}

/**
 * Gửi tin nhắn qua Telegram Bot
 */
async function sendTelegramMessage(token: string, chatId: string, message: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[BotNotify] Telegram send failed:", error);
    return false;
  }
}

/**
 * Bắn payload JSON tới Webhook Server của Admin
 */
async function sendWebhookPost(webhookUrl: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error("[BotNotify] Webhook POST failed:", error);
    return false;
  }
}

/**
 * Gửi thông báo khi người dùng tạo đơn nạp tiền mới
 */
export async function sendDepositNotification(data: {
  orderCode: number | string;
  userId: number;
  email?: string | null;
  amount: number;
  description: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt?: Date | number;
}): Promise<{ telegram: boolean; webhook: boolean }> {
  const config = await getBotConfig();
  const timeStr = formatDateTimeFullVietnam(data.createdAt ? new Date(data.createdAt) : new Date());
  const amountStr = `${data.amount.toLocaleString("vi-VN")} VNĐ`;

  let telegramSuccess = false;
  let webhookSuccess = false;

  // 1. Gửi Telegram nếu có token & chatId
  if (config.telegramBotToken && config.telegramChatId) {
    const msg = [
      `🔔 <b>YÊU CẦU NẠP TIỀN MỚI</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Thành viên:</b> ${data.email || `ID #${data.userId}`} (ID: #${data.userId})`,
      `💰 <b>Số tiền:</b> <code>${amountStr}</code>`,
      `🏦 <b>Ngân hàng:</b> ${data.bankName || "BIDV"}`,
      `💳 <b>STK nhận:</b> <code>${data.accountNumber || "8858978570"}</code> (${data.accountName || "NGUYEN THANH PHONG"})`,
      `📝 <b>Cú pháp CK:</b> <code>${data.description}</code>`,
      `🆔 <b>Mã đơn:</b> <code>#${data.orderCode}</code>`,
      `⏰ <b>Thời gian:</b> ${timeStr}`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <i>Vui lòng vào trang Quản trị để kiểm tra và duyệt tiền.</i>`,
    ].join("\n");

    telegramSuccess = await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, msg);
  }

  // 2. Bắn Webhook tới Server nếu có cấu hình
  if (config.webhookUrl) {
    webhookSuccess = await sendWebhookPost(config.webhookUrl, {
      event: "deposit.created",
      orderCode: data.orderCode,
      userId: data.userId,
      email: data.email,
      amount: data.amount,
      description: data.description,
      bank: {
        bankName: data.bankName || "BIDV",
        accountNumber: data.accountNumber || "8858978570",
        accountName: data.accountName || "NGUYEN THANH PHONG",
      },
      createdAt: data.createdAt || new Date().toISOString(),
    });
  }

  return { telegram: telegramSuccess, webhook: webhookSuccess };
}

/**
 * Gửi thông báo khi Admin duyệt nạp tiền thành công
 */
export async function sendDepositApprovedNotification(data: {
  orderCode: number | string;
  userId: number;
  email?: string | null;
  amount: number;
  approvedByRole?: string;
}): Promise<void> {
  const config = await getBotConfig();
  const amountStr = `${data.amount.toLocaleString("vi-VN")} VNĐ`;

  if (config.telegramBotToken && config.telegramChatId) {
    const msg = [
      `✅ <b>ĐÃ DUYỆT ĐƠN NẠP TIỀN #${data.orderCode}</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Thành viên:</b> ${data.email || `ID #${data.userId}`}`,
      `💰 <b>Đã cộng:</b> <code>+${amountStr}</code>`,
      `🛡️ <b>Người duyệt:</b> ${data.approvedByRole || "Admin"}`,
      `⏰ <b>Thời gian:</b> ${formatDateTimeFullVietnam(new Date())}`,
    ].join("\n");

    await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, msg);
  }

  if (config.webhookUrl) {
    await sendWebhookPost(config.webhookUrl, {
      event: "deposit.approved",
      orderCode: data.orderCode,
      userId: data.userId,
      email: data.email,
      amount: data.amount,
      status: "success",
      approvedAt: new Date().toISOString(),
    });
  }
}

/**
 * Gửi thông báo test thử nghiệm kết nối Bot / Server
 */
export async function testBotNotification(): Promise<{ telegram: boolean; webhook: boolean }> {
  const config = await getBotConfig();
  let telegramSuccess = false;
  let webhookSuccess = false;

  if (config.telegramBotToken && config.telegramChatId) {
    const msg = [
      `🤖 <b>KIỂM TRA KẾT NỐI BOT THÀNH CÔNG!</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `Hệ thống thông báo nạp tiền Mu Mới Ra đã kết nối thành công với Telegram Bot.`,
      `⏰ <b>Thời gian:</b> ${formatDateTimeFullVietnam(new Date())}`,
    ].join("\n");
    telegramSuccess = await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, msg);
  }

  if (config.webhookUrl) {
    webhookSuccess = await sendWebhookPost(config.webhookUrl, {
      event: "bot.test",
      message: "Test webhook from Mu Mới Ra server",
      timestamp: new Date().toISOString(),
    });
  }

  return { telegram: telegramSuccess, webhook: webhookSuccess };
}
