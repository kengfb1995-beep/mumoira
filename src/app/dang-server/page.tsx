import { Crown } from "lucide-react";
import { ContentPageHeader } from "@/components/layout/content-page-header";
import { PostServerForm } from "@/components/servers/post-server-form";
import { requireUser } from "@/lib/auth";

export default async function PostServerPage() {
  await requireUser();

  return (
    <div className="space-y-3 sm:space-y-4">
      <ContentPageHeader
        icon={Crown}
        title="Đăng server MU mới"
        description="Hoàn thiện thông tin để hiển thị trên danh bạ. Mỗi lượt đăng trừ 5.000đ từ số dư."
      />
      <PostServerForm />
    </div>
  );
}
