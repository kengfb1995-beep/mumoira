"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Globe, MessageSquare, Send, ShieldAlert } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

type BotFields = {
  telegramBotToken: string;
  telegramChatId: string;
  webhookUrl: string;
};

export function BotSettingsForm() {
  const [fields, setFields] = useState<BotFields>({
    telegramBotToken: "",
    telegramChatId: "",
    webhookUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/bot");
        if (res.ok) {
          const data = (await res.json()) as { telegramBotToken?: string; telegramChatId?: string; webhookUrl?: string };
          setFields({
            telegramBotToken: data.telegramBotToken || "",
            telegramChatId: data.telegramChatId || "",
            webhookUrl: data.webhookUrl || "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/admin/settings/bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(fields),
      });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(`❌ ${data.message || "Lỗi lưu cấu hình bot"}`);
      } else {
        setMessage("✅ Đã lưu cấu hình Bot thông báo thành công!");
      }
    } catch {
      setMessage("❌ Có lỗi xảy ra khi kết nối server");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/admin/settings/bot", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      });

      const data = (await res.json()) as {
        ok?: boolean;
        result?: { telegram?: boolean; webhook?: boolean };
        message?: string;
      };
      if (data.ok && (data.result?.telegram || data.result?.webhook)) {
        setMessage("🎉 Kiểm tra thành công! Tin nhắn đã được gửi tới Bot/Server của bạn.");
      } else {
        setMessage(`⚠️ ${data.message || "Không thể gửi tin nhắn thử nghiệm. Vui lòng kiểm tra lại cấu hình."}`);
      }
    } catch {
      setMessage("❌ Lỗi khi gửi yêu cầu kiểm tra bot");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-400">Đang tải cấu hình Bot...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="rounded-lg border border-amber-500/30 bg-black/40 p-3 text-sm text-amber-200">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Telegram Bot Token */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Bot className="h-4 w-4 text-sky-400" />
            Telegram Bot Token
          </label>
          <input
            type="password"
            value={fields.telegramBotToken}
            onChange={(e) => setFields((prev) => ({ ...prev, telegramBotToken: e.target.value }))}
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
            className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 font-mono text-sm text-amber-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Token lấy từ <b>@BotFather</b> trên Telegram.
          </p>
        </div>

        {/* Telegram Chat ID */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <MessageSquare className="h-4 w-4 text-sky-400" />
            Telegram Chat ID / Group ID
          </label>
          <input
            type="text"
            value={fields.telegramChatId}
            onChange={(e) => setFields((prev) => ({ ...prev, telegramChatId: e.target.value }))}
            placeholder="-1001234567890 hoặc 123456789"
            className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 font-mono text-sm text-amber-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            ID cuộc trò chuyện cá nhân hoặc ID nhóm Telegram (nhớ add bot vào nhóm). Lấy qua <b>@userinfobot</b> hoặc <b>@RawDataBot</b>.
          </p>
        </div>

        {/* Webhook URL cho Server riêng */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Globe className="h-4 w-4 text-emerald-400" />
            Server Webhook URL (Tùy chọn)
          </label>
          <input
            type="url"
            value={fields.webhookUrl}
            onChange={(e) => setFields((prev) => ({ ...prev, webhookUrl: e.target.value }))}
            placeholder="https://your-bot-server.com/api/notify"
            className="mt-1 w-full rounded-lg border border-amber-500/30 bg-black/50 px-3 py-2 font-mono text-sm text-amber-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Hệ thống sẽ gửi HTTP POST request kèm thông tin nạp tiền đến endpoint server này mỗi khi có đơn nạp mới.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || (!fields.telegramBotToken && !fields.webhookUrl)}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-950/40 px-3.5 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-900/50 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {testing ? "Đang gửi thử..." : "Bắn tin nhắn test thử Bot"}
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-600/30 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-600/50 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {submitting ? "Đang lưu..." : "Lưu cấu hình Bot"}
        </button>
      </div>
    </form>
  );
}
