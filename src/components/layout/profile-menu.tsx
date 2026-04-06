"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

type ProfileMenuProps = {
  email: string;
  balance: number;
  isAdmin: boolean;
};

const accountTabs = [
  { href: "/tai-khoan/tong-quan", label: "Tổng quan" },
  { href: "/nap-tien", label: "Nạp tiền" },
  { href: "/tai-khoan/mua-dich-vu", label: "Mua dịch vụ" },
  { href: "/tai-khoan/server", label: "Server của tôi" },
  { href: "/tai-khoan/giao-dich", label: "Giao dịch" },
  { href: "/tai-khoan/bao-mat", label: "Bảo mật" },
  { href: "/tai-khoan/thong-bao", label: "Thông báo" },
];

export function ProfileMenu({ email, balance, isAdmin }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = useMemo(() => {
    if (!isAdmin) return accountTabs;
    return [{ href: "/admin/tong-quan", label: "Admin" }, ...accountTabs];
  }, [isAdmin]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggingOut(false);
    setOpen(false);
    router.push("/dang-nhap");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-500/30 bg-black/35 px-2 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-400/60 sm:px-2.5"
      >
        <span className="hidden max-w-[100px] truncate text-[11px] font-medium text-zinc-200 sm:max-w-[140px] sm:text-xs">
          {email}
        </span>
        <span className="text-xs font-bold text-amber-200 sm:text-sm">
          {balance.toLocaleString("vi-VN")}đ
        </span>
        <ChevronDown
          className={`h-3 w-3 flex-shrink-0 text-amber-200 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute right-0 mt-1.5 w-52 overflow-hidden rounded-xl border border-amber-500/30 bg-[#140b0b] shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          <div className="max-h-[320px] overflow-y-auto p-1.5">
            {menuItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-red-950/50"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-amber-500/20 p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg border border-red-700/60 bg-red-900/45 px-3 py-2 text-sm font-bold text-red-200 hover:bg-red-800/60 disabled:opacity-70"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
