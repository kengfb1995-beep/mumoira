import Link from "next/link";
import { eq } from "drizzle-orm";
import { Crown, LogIn, Newspaper, Shield, Wallet } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const navItemsWithoutTopup = [
  { href: "/", label: "MU MỚI RA", icon: Shield },
  { href: "/tin-tuc", label: "TIN TỨC", icon: Newspaper },
  { href: "/dang-server", label: "ĐĂNG SERVER", icon: Crown },
];

export async function SiteHeader() {
  const session = await getSession();

  const profile = session
    ? await (getDb() as any)
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)
    : [];

  const balance = profile[0]?.balance ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[#243447] bg-[#0c1520]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-h-12 w-full max-w-[1480px] items-center justify-between gap-2 px-3 sm:h-11 sm:max-h-11 md:px-4 lg:px-6">
        <Link href="/" className="group inline-flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-mumoira.png"
            alt="MUMOIRA.ID.VN — Mu Mới Ra"
            width={220}
            height={40}
            className="h-7 w-auto shrink-0 opacity-95 transition group-hover:opacity-100 sm:h-8"
          />
          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-[11px]">
              Danh bạ game
            </p>
            <p className="truncate text-sm font-extrabold text-red-400/95 group-hover:text-red-300">
              Mu Mới Ra
            </p>
          </div>
        </Link>

        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
          <nav className="hidden min-w-0 flex-nowrap items-center lg:flex">
            {navItemsWithoutTopup.map((item, idx) => {
              const Icon = item.icon;
              return (
                <span key={item.href} className="flex shrink-0 items-center">
                  {idx > 0 ? (
                    <span className="mx-0.5 shrink-0 text-[10px] font-bold text-red-700 sm:mx-1" aria-hidden="true">
                      ◆
                    </span>
                  ) : null}
                  <Link
                    href={item.href}
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-[#2a3a4d] bg-[#1a2836] px-2 py-1 text-xs font-semibold text-zinc-300 transition hover:border-red-700/50 hover:text-white sm:px-2.5 sm:text-sm"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                </span>
              );
            })}
            <span className="mx-0.5 shrink-0 text-[10px] font-bold text-red-700 sm:mx-1" aria-hidden="true">
              ◆
            </span>
            <a
              href="/nap-tien"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-700/40 bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-300 transition hover:border-amber-600 hover:bg-amber-900/50 sm:px-2.5 sm:text-sm"
            >
              <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">NẠP TIỀN</span>
            </a>
          </nav>

          <MobileNav isLoggedIn={!!session} />

          {session ? (
            <ProfileMenu
              email={session.email}
              balance={balance}
              isAdmin={session.role === "admin" || session.role === "super_admin"}
            />
          ) : (
            <Link
              href="/dang-nhap"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-red-700 px-2 py-1 text-xs font-bold text-white transition hover:bg-red-600 sm:px-2.5 sm:text-sm"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          <Link
            href="/dang-server"
            className="hidden shrink-0 whitespace-nowrap rounded bg-red-700 px-2 py-1 text-center text-[10px] font-black uppercase tracking-wide text-white hover:bg-red-600 sm:inline-block sm:px-3 sm:text-[11px]"
          >
            Đăng MU mới
          </Link>
        </div>
      </div>
    </header>
  );
}
