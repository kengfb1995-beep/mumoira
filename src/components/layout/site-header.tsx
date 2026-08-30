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
    <header className="sticky top-0 z-40 border-b border-sky-950/60 bg-[#0a1017]/95 shadow-lg shadow-black/40 backdrop-blur-md">
      {/* Subtle top glowing bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-600 via-50% to-transparent opacity-80" />
      
      <div className="mx-auto flex h-12 max-h-12 w-full max-w-[1480px] items-center justify-between gap-2 px-3 sm:h-12 sm:max-h-12 md:px-4 lg:px-6">
        <Link href="/" className="group inline-flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-mumoira.png"
            alt="MUMOIRA.ID.VN — Mu Mới Ra"
            width={220}
            height={40}
            className="h-7 w-auto shrink-0 opacity-95 transition-transform duration-200 group-hover:scale-[1.02] sm:h-8"
          />
          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 sm:text-[11px]">
              Danh bạ game
            </p>
            <p className="truncate text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-red-400 group-hover:brightness-110">
              Mu Mới Ra
            </p>
          </div>
        </Link>

        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
          <nav className="hidden min-w-0 flex-nowrap items-center gap-1 lg:flex">
            {navItemsWithoutTopup.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-[#22354a] bg-[#121c27]/80 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition-all hover:border-red-500/50 hover:bg-[#182737] hover:text-white sm:text-[13px]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <a
              href="/nap-tien"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-400/50 bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-black shadow-sm shadow-amber-500/30 transition-all hover:brightness-110 hover:shadow-amber-500/50 sm:text-[13px]"
            >
              <Wallet className="h-3.5 w-3.5 shrink-0 text-black" aria-hidden="true" />
              <span>NẠP TIỀN</span>
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
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700/60 bg-[#16222f] px-2.5 py-1.5 text-xs font-bold text-zinc-200 transition hover:border-zinc-500 hover:text-white sm:px-3 sm:text-xs"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          <Link
            href="/dang-server"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white shadow-md shadow-red-600/30 transition-all hover:brightness-110 hover:shadow-red-600/50 active:scale-[0.98] sm:px-3.5 sm:text-xs"
          >
            <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Đăng MU mới</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
