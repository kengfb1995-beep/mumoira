import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    await db.run(sql`select 1`);

    return NextResponse.json({
      ok: true,
      service: "mu-moi-ra",
      db: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "mu-moi-ra",
        db: "down",
        message: error instanceof Error ? error.message : "Healthcheck failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
