"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { safeInternalPath } from "@/lib/safe-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const payload = (await res.json()) as { message?: string };
      setError(payload.message ?? "Đăng nhập không thành công");
      return;
    }

    const target = safeInternalPath(searchParams.get("next")) ?? "/";
    router.push(target);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080404] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a0a0a] via-[#0d0505] to-[#080404]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%23ffffff" fillOpacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      {/* Decorative glow orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] rounded-full bg-amber-900/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Logo area */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-mumoira.png"
              alt="MUMOIRA.ID.VN"
              width={220}
              height={40}
              className="mx-auto mb-4 h-11 w-auto max-w-[min(100%,280px)] object-contain object-center sm:h-12"
            />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MU <span className="text-amber-400">Mới Ra</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Đăng nhập để tiếp tục</p>
        </div>

        {/* Main card */}
        <div className="relative">
          {/* Glow border effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-red-700/30 via-red-900/10 to-amber-700/20 rounded-2xl" />

          <div className="relative bg-[#0f0808] rounded-2xl border border-[#1e1010] px-6 py-8 shadow-2xl shadow-black/60">
            {/* Card header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full" />
                Đăng nhập tài khoản
              </h2>
              <p className="text-zinc-500 text-xs mt-1.5 ml-3">Truy cập quản lý server, giao dịch và dịch vụ</p>
            </div>

            {/* Next path notice */}
            {nextPath ? (
              <div className="mb-5 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-amber-100/80 text-xs leading-relaxed">Bạn cần đăng nhập để tiếp tục. Hệ thống sẽ chuyển bạn đến trang đích sau khi xác thực.</p>
                </div>
              </div>
            ) : null}

            {/* Error */}
            {error ? (
              <div className="mb-5 rounded-xl bg-red-500/8 border border-red-500/25 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-200 text-xs leading-relaxed">{error}</p>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#2a1515] bg-[#0a0505] pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-red-700/60 focus:bg-[#0d0606] focus:outline-none focus:ring-1 focus:ring-red-700/30"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-xl border border-[#2a1515] bg-[#0a0505] pl-9 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-red-700/60 focus:bg-[#0d0606] focus:outline-none focus:ring-1 focus:ring-red-700/30"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-red-800/90 via-red-800 to-red-900/90 hover:from-red-700 hover:via-red-800 hover:to-red-800 border border-red-600/40 px-4 py-3 text-sm font-bold text-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-950/40 hover:shadow-red-900/60 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xác thực...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Đăng nhập
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#1e1010]" />
              <div className="flex-1 h-px bg-[#1e1010]" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-zinc-500">
              Chưa có tài khoản?{" "}
              <Link className="font-semibold text-amber-400 hover:text-amber-300 transition-colors" href="/dang-ky">
                Tạo tài khoản mới
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors flex items-center justify-center gap-1.5" href="/">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
