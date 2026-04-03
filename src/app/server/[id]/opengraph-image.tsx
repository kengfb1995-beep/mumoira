import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OgImage({ params }: Props) {
  const resolved = await params;
  const serverId = Number(resolved.id);

  const db = getDb();
  const row = await db
    .select({ name: servers.name, version: servers.version, exp: servers.exp, drop: servers.drop })
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);

  const server = row[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(130deg, #120707 0%, #361111 50%, #4a310f 100%)",
          color: "#fef3c7",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 2, textTransform: "uppercase", color: "#fcd34d" }}>Server Mu Mới Ra</div>
        <div style={{ fontSize: 62, lineHeight: 1.12, fontWeight: 700 }}>{server?.name ?? "MU PRIVATE"}</div>
        <div style={{ fontSize: 30, color: "#fde68a" }}>
          {server ? `Version ${server.version} · EXP ${server.exp} · Drop ${server.drop}` : "Khám phá server MU mới nhất"}
        </div>
      </div>
    ),
    size,
  );
}
