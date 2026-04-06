"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { message?: string; user?: { role?: string } };

      if (!res.ok) {
        setError(data.message ?? "Đăng nhập thất bại");
        return;
      }

      // Verify admin role
      if (data.user?.role !== "admin" && data.user?.role !== "super_admin") {
        setError("Tài khoản này không có quyền truy cập Admin.");
        // Clear session
        await fetch("/api/auth/logout", { method: "POST" });
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070304] px-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(120,20,20,0.4),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(120,90,20,0.25),_transparent_35%)]" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="rounded-2xl border border-amber-500/30 bg-[#120808]/80 px-4 py-3 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-mumoira.png"
              alt="MUMOIRA.ID.VN"
              width={200}
              height={36}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-amber-100">Admin Panel</h1>
            <p className="mt-1 text-sm text-zinc-400">Mu Mới Ra</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-amber-500/25 bg-[#120808]/85 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <h2 className="mb-5 text-lg font-bold text-amber-100">Đăng nhập quản trị</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/70 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/70 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-200"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-700/50 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-red-700 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Đang đăng nhập..." : "Đăng nhập Admin"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/dang-nhap" className="text-amber-400/70 hover:text-amber-300">
            Quay về trang đăng nhập thường
          </Link>
        </p>
      </div>
    </div>
  );
}
