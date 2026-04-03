import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/20 bg-black/25 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-red-950/40">
        <ShieldAlert className="h-6 w-6 text-amber-300" />
      </div>
      <h1 className="text-2xl font-bold text-amber-100">404 - Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-zinc-300">
        Trang bạn đang truy cập không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100"
      >
        Về trang chủ Mu Mới Ra
      </Link>
    </div>
  );
}
