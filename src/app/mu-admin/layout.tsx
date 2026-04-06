import type { Metadata } from "next";
import { Crown, Globe } from "lucide-react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: "Admin Panel | Mu Mới Ra",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120] h-screen w-screen overflow-hidden bg-[#070304]">
      <div className="flex h-full w-full">
        <AdminSidebar />

        <div className="min-w-0 flex-1 overflow-y-auto">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-500/20 bg-[#0a0505]/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200">Admin Panel</span>
              <span className="text-xs text-zinc-500">Mu Mới Ra</span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-black/35 px-3 py-1.5 text-xs font-medium text-amber-100 hover:border-amber-400/60 hover:bg-red-950/50"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              Xem trang chính
            </Link>
          </header>

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
