import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { type ServiceType } from "@/lib/pricing";
import { getServicePricingPerDay } from "@/lib/server-pricing";
import { upsertSecureSetting } from "@/lib/secure-settings";

const pricingSchema = z.object({
  vip_gold: z.number().int().positive(),
  vip_silver: z.number().int().positive(),
  banner_left_sidebar: z.number().int().positive(),
  banner_right_sidebar: z.number().int().positive(),
  banner_center_top: z.number().int().positive(),
  banner_center_mid: z.number().int().positive(),
});

export async function GET() {
  await requireAdmin();
  const pricing = await getServicePricingPerDay();
  return NextResponse.json({ pricing });
}

export async function POST(req: Request) {
  await requireAdmin();

  const payload = pricingSchema.parse(await req.json()) as Record<ServiceType, number>;
  await upsertSecureSetting("SERVICE_PRICING_PER_DAY_JSON", JSON.stringify(payload));

  return NextResponse.json({ ok: true });
}
