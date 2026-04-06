import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSecureSetting } from "@/lib/secure-settings";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const url = new URL(req.url);
    const key = url.searchParams.get("key") ?? "GROQ_API_KEY";
    const value = await getSecureSetting(key);

    return NextResponse.json({ value: value ?? "" });
  } catch {
    return NextResponse.json({ value: "" });
  }
}
