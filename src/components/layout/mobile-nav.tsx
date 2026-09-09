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
        className="rounded-md border border-[#22354a] bg-[#121c27] p-2 text-zinc-300 hover:border-red-500 hover:text-white lg:hidden transition"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1016]/98 backdrop-blur-xl lg:hidden text-zinc-200">
          <div className="flex items-center justify-between border-b border-sky-950/60 px-4 py-3 bg-[#0e1620]">
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-red-400">
              Menu MU Mới Ra
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-[#22354a] bg-[#121c27] p-2 text-zinc-400 hover:text-white"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-[#22354a] bg-[#121c27]/90 px-4 py-3 text-base font-bold text-zinc-200 hover:border-amber-400 hover:bg-[#192737] hover:text-white transition shadow-sm"
                  >
                    <Icon className="h-5 w-5 text-amber-400" />
                    {item.label}
                  </Link>
                );
              })}

              <TopupGateLinkMobile isLoggedIn={isLoggedIn} onNavigate={() => setOpen(false)} />

              {!isLoggedIn && (
                <>
                  <div className="my-4 border-t border-sky-950/60" />
                  {authItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg border border-red-500/80 bg-gradient-to-r from-red-600 to-rose-700 px-4 py-3 text-base font-black uppercase text-white shadow-md hover:brightness-110"
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
