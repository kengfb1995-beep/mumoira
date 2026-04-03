import { requireUser } from "@/lib/auth";
import { PostServerForm } from "@/components/servers/post-server-form";

export default async function PostServerPage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-100">Đăng server MU mới</h1>
      <p className="text-sm text-zinc-300">
        Mỗi lượt đăng server sẽ trừ <span className="font-semibold text-amber-200">5.000đ</span> từ số dư tài khoản.
      </p>
      <PostServerForm />
    </div>
  );
}
