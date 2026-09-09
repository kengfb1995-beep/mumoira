"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ChevronRight,
  CreditCard,
  Crown,
  FolderSync,
  Gauge,
  Globe,
  ImageIcon,
  KeyRound,
  Layers,
  LogOut,
  Rss,
  Shield,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

type AdminUser = {
  userId?: number;
  email?: string;
  role?: "super_admin" | "admin" | "user";
};

type AdminSidebarProps = {
  user?: AdminUser | null;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

const navItems = [
  { href: "/mu-admin/tong-quan", label: "Tổng quan", icon: Gauge, exact: true },
  { href: "/mu-admin/server", label: "Server", icon: Layers },
  { href: "/mu-admin/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/mu-admin/nap-tien", label: "Nạp tiền", icon: CreditCard },
  { href: "/mu-admin/giao-dich", label: "Giao dịch", icon: Activity },
  { href: "/mu-admin/banner", label: "Banner", icon: ImageIcon },
  { href: "/mu-admin/cao-bai", label: "Cào bài AI", icon: Rss },
  { href: "/mu-admin/seo", label: "Cấu hình SEO", icon: Globe },
  { href: "/mu-admin/api-key", label: "API Key", icon: KeyRound },
  { href: "/mu-admin/tien-ich", label: "Tiện ích", icon: FolderSync },
  { href: "/mu-admin/analytics", label: "Analytics", icon: ShoppingCart },
];

export function AdminSidebar({ user, mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingServerCount, setPendingServerCount] = useState<number | null>(null);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  // Fetch pending server count for badge
  useEffect(() => {
    let active = true;
    async function fetchPending() {
      try {
        const res = await fetch("/api/admin/server?status=pending");
        if (res.ok) {
          const data = (await res.json()) as { servers?: any[] };
          if (active && data.servers) {
            setPendingServerCount(data.servers.length);
          }
        }
      } catch {}
    }
    void fetchPending();
    return () => {
      active = false;
    };
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 px-4 py-4 bg-gradient-to-r from-red-950/20 to-black/40">
        <Link href="/mu-admin/tong-quan" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-red-900/30 to-black p-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Crown className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-wide text-amber-100">
                MU MỚI RA
              </span>
              <span className="rounded bg-red-600/30 border border-red-500/40 px-1 py-0.2 text-[9px] font-bold text-red-300 uppercase">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">Bảng điều khiển quản trị</p>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-black/50 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          const isServerItem = item.href === "/mu-admin/server";

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                active
                  ? "border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-red-950/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.12)]"
                  : "border border-transparent text-zinc-300 hover:border-amber-500/20 hover:bg-white/[0.03] hover:text-amber-200"
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  active ? "text-amber-300" : "text-zinc-400 group-hover:text-amber-300"
                }`}
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>

              {/* Pending badge on Server link */}
              {isServerItem && pendingServerCount !== null && pendingServerCount > 0 && (
                <span className="animate-pulse rounded-full border border-amber-400/50 bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {pendingServerCount} chờ
                </span>
              )}

              {active && <ChevronRight className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Actions */}
      <div className="border-t border-amber-500/20 bg-black/40 p-3 space-y-2">
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-gradient-to-r from-black/60 to-red-950/20 p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200" title={user.email}>
                {user.email || "Quản trị viên"}
              </p>
              <div className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-amber-300/90 font-medium">
                  {user.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-amber-500/30 hover:text-amber-200 transition"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 hover:border-red-700/60 hover:bg-red-900/40 disabled:opacity-50 transition"
            title="Đăng xuất"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{loggingOut ? "..." : "Thoát"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-full w-[250px] shrink-0 flex-col border-r border-amber-500/20 bg-[#0f0707]/98 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <aside className="relative flex w-[280px] max-w-[85vw] flex-col border-r border-amber-500/30 bg-[#0f0707] shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}