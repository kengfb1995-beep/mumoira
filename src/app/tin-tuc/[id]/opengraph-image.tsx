import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { posts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { parsePostIdFromSlug } from "@/lib/seo";

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
  const postId = parsePostIdFromSlug(resolved.id);

  let title = "Tin tức Mu Mới Ra";
  if (postId) {
    const db = getDb();
    const row = await db
      .select({ title: posts.title })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (row[0]?.title) title = row[0].title;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #140707 0%, #2a0f0f 45%, #3a2a0f 100%)",
          color: "#fcd34d",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9 }}>Mu Mới Ra</div>
        <div style={{ fontSize: 62, lineHeight: 1.15, fontWeight: 700, color: "#fef3c7" }}>{title}</div>
        <div style={{ fontSize: 28, color: "#fde68a" }}>Tin tức MU Private cập nhật liên tục</div>
      </div>
    ),
    size,
  );
}
