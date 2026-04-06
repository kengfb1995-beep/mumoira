"use client";

import { CreditCard } from "lucide-react";
import { KeyRound } from "lucide-react";
import { GemmaKeyForm } from "@/components/admin/gemma-key-form";
import { GroqKeyForm } from "@/components/admin/groq-key-form";
import { PayOSCredentialsForm } from "@/components/admin/payos-credentials-form";

export default function ApiKeyPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <KeyRound className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">API Key</h1>
          <p className="text-sm text-zinc-400">Quản lý API keys cho AI rewriting và các dịch vụ bên thứ ba.</p>
        </div>
      </header>

      {/* PayOS Credentials */}
      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-amber-200">PayOS Credentials</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Dùng để tạo mã QR thanh toán nạp tiền và xác minh webhook từ PayOS.
          </p>
        </div>
        <PayOSCredentialsForm />
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
        <h2 className="mb-3 text-lg font-semibold text-amber-200">Hướng dẫn lấy API Key</h2>
        <div className="space-y-3 text-sm text-zinc-300">
          <div className="rounded-md border border-amber-500/10 bg-black/30 p-3">
            <p className="font-semibold text-amber-200">PayOS</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-zinc-400">
              <li>Đăng ký tại <a href="https://pay.payos.vn" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">pay.payos.vn</a></li>
              <li>Vào <strong>Cài đặt tích hợp</strong> → Lấy Client ID, API Key, Checksum Key</li>
              <li>Webhook URL: <code className="rounded bg-black/50 px-1 text-amber-300">https://mumoira.id.vn/api/payos/webhook</code></li>
            </ol>
          </div>
          <div className="rounded-md border border-amber-500/10 bg-black/30 p-3">
            <p className="font-semibold text-amber-200">OpenRouter (Gemma)</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-zinc-400">
              <li>Đăng ký tại <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">openrouter.ai</a></li>
              <li>Vào mục API Keys → Create Key</li>
              <li>Sao chép và dán vào ô bên trên</li>
            </ol>
          </div>
          <div className="rounded-md border border-amber-500/10 bg-black/30 p-3">
            <p className="font-semibold text-amber-200">Groq</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-zinc-400">
              <li>Đăng ký tại <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">console.groq.com</a></li>
              <li>Vào API Keys → Create</li>
              <li>Sao chép và dán vào ô bên trên</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
