"use client";

import { useState } from "react";
import { FolderSync } from "lucide-react";
import { RebuildServerSlugsForm } from "@/components/admin/rebuild-server-slugs-form";
import { RebuildPostSlugsForm } from "@/components/admin/rebuild-post-slugs-form";
import { ServicePricingForm } from "@/components/admin/service-pricing-form";
import { SystemStatusCard } from "@/components/admin/system-status-card";

export default function TienIchPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <FolderSync className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Tiện ích</h1>
          <p className="text-sm text-zinc-400">Các công cụ hỗ trợ vận hành hệ thống.</p>
        </div>
      </header>

      <SystemStatusCard />

      <div className="space-y-4">
        <ServicePricingForm />
        <RebuildPostSlugsForm />
        <RebuildServerSlugsForm />
      </div>
    </div>
  );
}
