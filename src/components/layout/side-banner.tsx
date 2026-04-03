import Link from "next/link";

type SideBannerProps = {
  side: "left" | "right";
};

export function SideBanner({ side }: SideBannerProps) {
  const isLeft = side === "left";

  return (
    <aside className="sticky top-[88px] hidden h-[calc(100vh-110px)] w-[180px] xl:block">
      <Link
        href="#"
        className="group relative flex h-full overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-b from-[#2b0d0d] via-[#130909] to-[#090505]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,215,128,0.25),_transparent_55%)]" />
        <div className="relative flex h-full w-full flex-col items-center justify-between px-4 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-400/80">Banner {isLeft ? "Trái" : "Phải"}</p>
          <div>
            <p className="text-2xl font-extrabold text-amber-200">MU PRIVATE</p>
            <p className="mt-3 text-sm text-zinc-200/90">Vị trí quảng cáo nổi bật cho server mới ra mắt.</p>
          </div>
          <p className="rounded-md border border-amber-500/30 bg-black/30 px-3 py-2 text-xs text-amber-100">
            180 x 720
          </p>
        </div>
      </Link>
    </aside>
  );
}
