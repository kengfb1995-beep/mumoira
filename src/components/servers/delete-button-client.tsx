"use client";
 
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUi } from "@/components/providers/ui-provider";
 
export function DeleteButtonClient({ id }: { id: number }) {
  const router = useRouter();
  const { notify, confirm } = useUi();
  const [isDeleting, setIsDeleting] = useState(false);
 
  async function handleDelete() {
    const ok = await confirm({
      title: "Xác nhận xóa server",
      description: "Bạn có chắc chắn muốn xóa server này không? Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa ngay",
      cancelLabel: "Bỏ qua",
    });

    if (!ok) return;
 
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/servers/${id}/delete`, {
        method: "DELETE",
      });
 
      if (res.ok) {
        notify({ title: "Đã xóa server thành công", type: "success" });
        router.refresh();
      } else {
        const err = await res.json() as { error?: string };
        notify({ title: err.error || "Lỗi khi xóa server", type: "error" });
      }
    } catch (error: any) {
      notify({ title: "Lỗi kết nối", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  }
 
  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50 shadow-sm"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isDeleting ? "Đang xóa..." : "Xóa bài"}
    </button>
  );
}
