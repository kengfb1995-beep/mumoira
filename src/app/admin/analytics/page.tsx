import { BarChart3 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-amber-300" />
        <h1 className="text-2xl font-bold text-amber-100">Analytics vận hành</h1>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
