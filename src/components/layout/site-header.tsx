import Link from "next/link";
import { Crown, LogIn, Newspaper, Shield, Swords, Wallet } from "lucide-react";
import { getSession } from "@/lib/session";

const navItems = [
  { href: "/", label: "Trang Chủ", icon: Shield },
  { href: "/tin-tuc", label: "Tin Tức", icon: Newspaper },
  { href: "/dang-server", label: "Đăng Server", icon: Crown },
  { href: "/nap-tien", label: "Nạp Tiền", icon: Wallet },
];

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-amber-700/30 bg-[#150b0b]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="group inline-flex items-center gap-2">
          <div className="rounded-md border border-amber-500/40 bg-red-950/70 p-2 text-amber-300">
            <Swords className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Danh bạ game</p>
            <p className="text-lg font-bold text-amber-200 group-hover:text-amber-100">Mu Mới Ra</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-md border border-amber-500/20 bg-black/20 px-3 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/50 hover:bg-red-950/40"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}

          {session ? (
            <>
              {session.role === "admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-800/40 px-3 py-2 text-sm font-semibold text-amber-100"
                >
                  <Crown className="h-4 w-4" aria-hidden="true" />
                  Admin
                </Link>
              ) : null}
              <span className="rounded-md border border-amber-500/20 bg-black/20 px-3 py-2 text-sm text-amber-100">
                {session.email}
              </span>
            </>
          ) : (
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-2 rounded-md border border-red-700/60 bg-red-800/80 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-red-700"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
