import Groq from "groq-sdk";
import { getSecureSetting } from "@/lib/secure-settings";

export async function getGroqApiKeyFromDb() {
  const key = (await getSecureSetting("GROQ_API_KEY"))?.trim();
  if (!key) {
    throw new Error("Chưa cấu hình GROQ_API_KEY trong phần admin.");
  }

  return key;
}

export async function rewriteArticleToSeoHtml(input: {
  title: string;
  sourceHtml: string;
  sourceUrl: string;
}) {
  const apiKey = await getGroqApiKeyFromDb();
  const client = new Groq({ apiKey });

  const prompt = [
    "Bạn là biên tập viên SEO chuyên về game MU Online.",
    "Hãy viết lại nội dung dưới dạng HTML sạch, chuẩn SEO tiếng Việt.",
    "YÊU CẦU BẮT BUỘC:",
    "1) Trả về DUY NHẤT HTML, không markdown, không giải thích.",
    "2) Có đúng 1 thẻ <h1>, nhiều <h2>, có <h3> khi cần.",
    "3) Tối ưu từ khóa tự nhiên cho: Mu Mới Ra, Mu Private.",
    "4) Mọi thẻ <img> phải có thuộc tính alt mô tả phù hợp.",
    "5) Giữ các link ảnh gốc nếu có, không đổi domain ảnh.",
    "6) Nội dung dễ đọc, có mở bài, thân bài, kết luận.",
    `Tiêu đề gốc: ${input.title}`,
    `Nguồn: ${input.sourceUrl}`,
    "Nội dung HTML gốc:",
    input.sourceHtml.slice(0, 16000),
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: "Bạn tạo nội dung HTML SEO chất lượng cao cho website tin tức game.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq không trả về nội dung.");
  }

  return content;
}
