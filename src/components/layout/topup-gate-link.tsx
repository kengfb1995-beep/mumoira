"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { useUi } from "@/components/providers/ui-provider";

type TopupGateLinkProps = {
  isLoggedIn: boolean;
  className: string;
  label: string;
  onNavigate?: () => void;
};

export function TopupGateLink({ isLoggedIn, className, label, onNavigate }: TopupGateLinkProps) {
  const { notify } = useUi();
  const router = useRouter();

  return (
    <Link
      href="/nap-tien"
      className={className}
      onClick={(e) => {
        if (!isLoggedIn) {
          e.preventDefault();
          notify({ type: "info", title: "Vui lòng đăng nhập để nạp tiền" });
          router.push("/dang-nhap?next=%2Fnap-tien");
          onNavigate?.();
        } else {
          onNavigate?.();
        }
      }}
    >
      <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      <span className="hidden xl:inline">{label}</span>
    </Link>
  );
}

export function TopupGateLinkMobile({
  isLoggedIn,
  onNavigate,
}: {
  isLoggedIn: boolean;
  onNavigate?: () => void;
}) {
  const { notify } = useUi();
  const router = useRouter();

  return (
    <Link
      href="/nap-tien"
      onClick={(e) => {
        if (!isLoggedIn) {
          e.preventDefault();
          notify({ type: "info", title: "Vui lòng đăng nhập để nạp tiền" });
          router.push("/dang-nhap?next=%2Fnap-tien");
        }
        onNavigate?.();
      }}
      className="flex items-center gap-3 rounded-lg border border-amber-400/60 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-3 text-base font-black uppercase tracking-wider text-zinc-950 shadow-md shadow-amber-500/20 transition hover:brightness-110"
    >
      <Wallet className="h-5 w-5 text-zinc-950" aria-hidden="true" />
      <span>Nạp Tiền</span>
    </Link>
  );
}
