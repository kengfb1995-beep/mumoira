import type { LucideIcon } from "lucide-react";

type ContentPageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
};

export function ContentPageHeader({ title, description, icon: Icon }: ContentPageHeaderProps) {
  return (
    <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#2b0f0f] to-[#100909] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-950/35 text-amber-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-amber-100 sm:text-2xl md:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-xs text-zinc-300 sm:text-sm">{description}</p> : null}
        </div>
      </div>
    </header>
  );
}
