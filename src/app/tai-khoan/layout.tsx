import { Sparkles } from "lucide-react";
import { AccountSubNav } from "@/components/account/account-sub-nav";
import { ContentPageHeader } from "@/components/layout/content-page-header";
import { requireUser } from "@/lib/auth";

export default async function TaiKhoanLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="space-y-4 sm:space-y-6">
      <ContentPageHeader
        icon={Sparkles}
        title="Trung tâm tài khoản"
        description="Quản lý tài khoản, nạp tiền, dịch vụ VIP/Banner và server MU."
      />

      <AccountSubNav />

      {children}
    </div>
  );
}
