import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/30 bg-black/40 p-8 text-center text-sm text-zinc-300">Đang tải...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
