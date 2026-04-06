/** Badge VIP Vàng — nền tối, chữ vàng nghiêng, đuôi ribbon (bố cục kiểu danh sách portal). */
export function VipGoldRibbon({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-start ${className}`} title="VIP Vàng">
      <div
        className="inline-flex items-center bg-gradient-to-b from-zinc-700 to-zinc-900 py-1 pl-2 pr-5 text-xs font-bold italic tracking-wide text-amber-300 shadow-sm ring-1 ring-black/40 sm:py-1.5 sm:pl-2.5 sm:pr-6 sm:text-sm"
        style={{
          clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)",
        }}
      >
        <span className="whitespace-nowrap font-bold italic tracking-wide">VIP VÀNG</span>
      </div>
    </div>
  );
}
