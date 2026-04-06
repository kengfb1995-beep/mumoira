import { NextResponse } from "next/server";
import { getServicePricingPerDay } from "@/lib/server-pricing";

export async function GET() {
  const pricing = await getServicePricingPerDay();
  return NextResponse.json({ pricing });
}
