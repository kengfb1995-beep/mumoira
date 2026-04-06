import Link from "next/link";
import { Crown } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-6 border-t border-amber-500/20 bg-black/40 pt-8 pb-6">
      <div className="mx-auto w-full max-w-[1480px] px-3 md:px-4 lg:px-6">
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-red-950/60">
                <Crown className="h-4 w-4 text-amber-300" />
              </div>
              <span className="font-bold text-amber-100">Mu Mới Ra</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              Danh bạ máy chủ MU Private mới nhất Việt Nam. Nền tảng đăng server, quản lý dịch vụ VIP và quảng bá banner chuyên nghiệp.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-amber-200">Máy chủ</h3>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              <li>
                <Link href="/" className="transition hover:text-amber-300">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/dang-server" className="transition hover:text-amber-300">
                  Đăng server mới
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-amber-200">Thông tin</h3>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              <li>
                <Link href="/tin-tuc" className="transition hover:text-amber-300">
                  Tin tức MU Online
                </Link>
              </li>
              <li>
                <Link href="/dang-nhap" className="transition hover:text-amber-300">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link href="/dang-ky" className="transition hover:text-amber-300">
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link href="/nap-tien" className="transition hover:text-amber-300">
                  Nạp tiền
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-amber-200">Pháp lý</h3>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              <li>
                <Link href="/sitemap.xml" className="transition hover:text-amber-300">
                  Sitemap
                </Link>
              </li>
              <li>
                <a href="/robots.txt" className="transition hover:text-amber-300">
                  Robots.txt
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-500/10 pt-6 text-center">
          <p className="text-sm text-zinc-500">
            © {currentYear} Mu Mới Ra — Danh bạ máy chủ MU Private Việt Nam. Game MU Online là sản phẩm của{" "}
            <a
              href="https://webzen.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/70 hover:text-amber-300"
            >
              Webzen
            </a>
            .
          </p>
          <p className="mt-1 text-xs text-zinc-600">Chơi game có thưởng, chơi có trách nhiệm. Độ tuổi phù hợp: 13+.</p>
        </div>
      </div>
    </footer>
  );
}
