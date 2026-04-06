"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Lock, Receipt, Server, ShoppingBag, Sparkles, Wallet } from "lucide-react";

const links: { href: string; label: string; icon: React.ElementType; match?: (path: string) => boolean }[] = [
  { href: "/tai-khoan/tong-quan", label: "Tổng quan", icon: Sparkles },
  {
    href: "/nap-tien",
    label: "Nạp tiền",
    icon: Wallet,
    match: (path) => path === "/nap-tien" || path.startsWith("/nap-tien/"),
  },
  { href: "/tai-khoan/mua-dich-vu", label: "Mua dịch vụ", icon: ShoppingBag },
  { href: "/tai-khoan/server", label: "Server của tôi", icon: Server },
  { href: "/tai-khoan/giao-dich", label: "Giao dịch", icon: Receipt },
  { href: "/tai-khoan/bao-mat", label: "Bảo mật", icon: Lock },
  { href: "/tai-khoan/thong-bao", label: "Thông báo", icon: Bell },
];

export function AccountSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="grid gap-1.5 rounded-2xl border border-amber-500/20 bg-black/25 p-2 sm:gap-2 sm:grid-cols-2 sm:p-3 lg:grid-cols-4">
      {links.map((item) => {
        const Icon = item.icon;
        const active = item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
              active
                ? "border-amber-400/70 bg-amber-950/40 text-amber-50"
                : "border-amber-500/20 bg-black/30 text-amber-100 hover:border-amber-400/60"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="min-w-0 truncate text-[11px] sm:text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
