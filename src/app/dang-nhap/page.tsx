"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(payload.message ?? "Đăng nhập thất bại");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-amber-500/20 bg-black/25 p-6">
      <h1 className="text-2xl font-bold text-amber-200">Đăng nhập</h1>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-red-700/60 bg-red-800/80 px-3 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-300">
        Chưa có tài khoản?{" "}
        <Link className="text-amber-300 hover:underline" href="/dang-ky">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
