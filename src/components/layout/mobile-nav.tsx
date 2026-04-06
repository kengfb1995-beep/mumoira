"use client";

import Link from "next/link";
import { useState } from "react";
import { Crown, LogIn, Menu, Newspaper, Shield, X } from "lucide-react";
import { TopupGateLinkMobile } from "@/components/layout/topup-gate-link";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/", label: "Trang Chủ", icon: Shield },
  { href: "/tin-tuc", label: "Tin Tức", icon: Newspaper },
  { href: "/dang-server", label: "Đăng Server", icon: Crown },
];

const authItems: NavItem[] = [
  { href: "/dang-nhap", label: "Đăng nhập", icon: LogIn },
];

interface MobileNavProps {
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

export function MobileNav({ isLoggedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 lg:hidden"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <span className="text-lg font-bold text-zinc-900">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-700"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-base font-semibold text-zinc-700 hover:bg-white hover:border-zinc-300 transition"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              <TopupGateLinkMobile isLoggedIn={isLoggedIn} onNavigate={() => setOpen(false)} />

              {!isLoggedIn && (
                <>
                  <div className="my-4 border-t border-zinc-100" />
                  {authItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-600 px-4 py-3 text-base font-bold text-white hover:bg-red-700 shadow-sm"
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
