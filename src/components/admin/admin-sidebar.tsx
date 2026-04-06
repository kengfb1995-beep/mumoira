"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronRight,
  CreditCard,
  FolderSync,
  Gauge,
  Globe,
  ImageIcon,
  KeyRound,
  Layers,
  LogOut,
  Newspaper,
  Rss,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/mu-admin/tong-quan", label: "Tổng quan", icon: Gauge, exact: true },
  { href: "/mu-admin/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/mu-admin/nap-tien", label: "Nạp tiền", icon: CreditCard },
  { href: "/mu-admin/giao-dich", label: "Giao dịch", icon: Activity },
  { href: "/mu-admin/server", label: "Server", icon: Layers },
  { href: "/mu-admin/banner", label: "Banner", icon: ImageIcon },
  { href: "/mu-admin/cao-bai", label: "Cào bài", icon: Rss },
  { href: "/mu-admin/seo", label: "Cấu hình SEO", icon: Globe },
  { href: "/mu-admin/api-key", label: "API Key", icon: KeyRound },
  { href: "/mu-admin/tien-ich", label: "Tiện ích", icon: FolderSync },
  { href: "/mu-admin/analytics", label: "Analytics", icon: ShoppingCart },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dang-nhap");
  }

  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col border-r border-amber-500/20 bg-[#100808]/95">
      <div className="border-b border-amber-500/20 px-4 py-4">
        <p className="text-sm font-bold text-amber-200">Admin Panel</p>
        <p className="text-xs text-zinc-400">Mu Mới Ra</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border border-amber-500/40 bg-amber-500/10 text-amber-100"
                      : "text-zinc-300 hover:bg-black/30 hover:text-amber-100"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3 w-3 text-amber-400" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-amber-500/20 px-2 py-3">
        <Link
          href="/"
          className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-black/30 hover:text-amber-100"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          Xem trang chính
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-black/30 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}