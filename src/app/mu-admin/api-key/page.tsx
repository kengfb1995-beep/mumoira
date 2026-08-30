"use client";

import { Bot, Building2, KeyRound } from "lucide-react";
import { BankSettingsForm } from "@/components/admin/bank-settings-form";
import { BotSettingsForm } from "@/components/admin/bot-settings-form";
import { GemmaKeyForm } from "@/components/admin/gemma-key-form";
import { GroqKeyForm } from "@/components/admin/groq-key-form";

export default function ApiKeyPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <KeyRound className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Cấu hình API & Hệ thống</h1>
          <p className="text-sm text-zinc-400">
            Quản lý tài khoản nhận tiền VietQR, Bot/Webhook thông báo và API AI.
          </p>
        </div>
      </header>

      {/* Cấu hình Ngân hàng VietQR */}
      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">Tài khoản Ngân hàng nhận nạp tiền (VietQR)</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Thông tin tài khoản để tự động sinh mã VietQR và nội dung chuyển khoản cho người dùng.
          </p>
        </div>
        <BankSettingsForm />
      </div>

      {/* Cấu hình Bot Thông báo */}
      <div className="rounded-xl border border-sky-500/20 bg-black/25 p-5">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-amber-200">Cấu hình Bot & Server thông báo nạp tiền</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Tự động gửi tin nhắn đến Telegram Bot hoặc Webhook Server của bạn ngay khi thành viên tạo đơn nạp tiền.
          </p>
        </div>
        <BotSettingsForm />
      </div>

      {/* Gemma Key */}
      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-amber-200">Gemma / OpenRouter API Key</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Dùng để viết lại bài viết từ nguồn bên ngoài thành nội dung SEO chuẩn.
            Hỗ trợ OpenRouter (Gemma, Claude, GPT...).
          </p>
        </div>
        <GemmaKeyForm defaultValue="" />
      </div>

      {/* Groq Key */}
      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-amber-200">Groq API Key</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Dùng cho các tác vụ AI nhẹ (tốc độ cao, chi phí thấp).
          </p>
        </div>
        <GroqKeyForm defaultValue="" />
      </div>

      {/* Info */}
      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
        <h2 className="mb-3 text-lg font-semibold text-amber-200">Hướng dẫn cấu hình</h2>
        <div className="space-y-3 text-sm text-zinc-300">
          <div className="rounded-md border border-sky-500/20 bg-black/30 p-3">
            <p className="font-semibold text-sky-300">Telegram Bot Thông báo</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-zinc-400">
              <li>Mở Telegram, tìm <b>@BotFather</b> và gõ lệnh <code>/newbot</code> để tạo Bot và lấy API Token.</li>
              <li>Tạo 1 Group hoặc Chat riêng với bot, bấm <code>/start</code>.</li>
              <li>Thêm <b>@RawDataBot</b> hoặc <b>@userinfobot</b> vào chat để lấy <code>chat_id</code>.</li>
              <li>Dán Token và Chat ID vào form trên rồi bấm <b>Bắn tin nhắn test thử Bot</b>.</li>
            </ol>
          </div>

          <div className="rounded-md border border-amber-500/10 bg-black/30 p-3">
            <p className="font-semibold text-amber-200">OpenRouter (Gemma)</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-zinc-400">
              <li>Đăng ký tại <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">openrouter.ai</a></li>
              <li>Vào mục API Keys → Create Key rồi dán vào ô bên trên.</li>
            </ol>
          </div>

          <div className="rounded-md border border-amber-500/10 bg-black/30 p-3">
            <p className="font-semibold text-amber-200">Groq</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-zinc-400">
              <li>Đăng ký tại <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">console.groq.com</a></li>
              <li>Vào API Keys → Create rồi dán vào ô bên trên.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
