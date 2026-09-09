"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Globe, LogOut, Menu, Shield } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

type AdminUser = {
  userId: number;
  email: string;
  role: "super_admin" | "admin" | "user";
};

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/mu-admin/dang-nhap";

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function checkAdminAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (isMounted) {
            router.replace("/mu-admin/dang-nhap?next=" + encodeURIComponent(pathname));
          }
          return;
        }

        const data = (await res.json()) as { user?: AdminUser | null };
        if (!data.user || (data.user.role !== "admin" && data.user.role !== "super_admin")) {
          if (isMounted) {
            router.replace("/mu-admin/dang-nhap?error=forbidden&next=" + encodeURIComponent(pathname));
          }
          return;
        }

        if (isMounted) {
          setUser(data.user);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          router.replace("/mu-admin/dang-nhap?next=" + encodeURIComponent(pathname));
        }
      }
    }

    void checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [isLoginPage, pathname, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/mu-admin/dang-nhap");
      router.refresh();
    }
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#070304] text-center px-4">
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-black/60 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Crown className="h-7 w-7 text-amber-400 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-amber-200">Đang xác thực quyền Admin...</h3>
        <p className="mt-1 text-xs text-zinc-500">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] h-screen w-screen overflow-hidden bg-[#070304] text-zinc-100 antialiased">
      <div className="flex h-full w-full">
        <AdminSidebar
          user={user}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-amber-500/20 bg-[#0c0606]/95 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex md:hidden items-center justify-center rounded-lg border border-amber-500/30 bg-black/40 p-2 text-amber-200 hover:bg-amber-500/10 focus:outline-none"
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-red-900/30 text-amber-300 shadow-sm">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-100 tracking-wide">
                      Admin Panel
                    </span>
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      v2.0
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Mu Mới Ra · Quản trị hệ thống</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-amber-500/25 bg-black/40 px-3 py-1.5 text-xs">
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-medium text-zinc-200 max-w-[160px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                    {user.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
              )}

              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-black/40 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400/60 hover:bg-amber-500/10"
                title="Mở trang chủ người dùng"
              >
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden xs:inline">Trang chủ</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 rounded-lg border border-red-700/40 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/40 hover:border-red-600/60 disabled:opacity-50"
                title="Đăng xuất khỏi Admin"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{loggingOut ? "..." : "Thoát"}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
