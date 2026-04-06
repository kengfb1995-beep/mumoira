import { BarChart3 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/20 bg-black/20 p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-amber-300" />
          <h1 className="text-2xl font-bold text-amber-100">Analytics vận hành</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-300">
          Theo dõi chỉ số hoạt động theo thời gian thực, phát hiện sự cố và hành động nhanh.
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
