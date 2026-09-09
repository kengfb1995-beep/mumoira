import { Crown } from "lucide-react";

/** Badge VIP Vàng — nền tối kim loại, vương miện SVG casino, chữ vàng nghiêng, đuôi ribbon */
export function VipGoldRibbon({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-start ${className}`} title="VIP Vàng">
      <div
        className="inline-flex items-center gap-1 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/80 border-l-2 border-amber-400 py-1 pl-2 pr-5 text-xs font-black italic tracking-wide shadow-md ring-1 ring-amber-500/40 sm:py-1.5 sm:pl-2.5 sm:pr-6 sm:text-xs"
        style={{
          clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)",
        }}
      >
        <Crown className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
          VIP VÀNG
        </span>
      </div>
    </div>
  );
}
