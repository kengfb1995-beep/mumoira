import { getSecureSetting } from "@/lib/secure-settings";

type RewriteInput = {
  title: string;
  sourceHtml: string;
  sourceUrl: string;
};

type RewriteOutput = {
  title: string;
  excerpt: string;
  html: string;
  seoKeywords: string;
};

async function getAiApiKeyFromDb() {
  const key = (await getSecureSetting("GEMMA_API_KEY"))?.trim();
  if (!key) {
    throw new Error("Chưa cấu hình API Key (GEMMA_API_KEY) trong phần admin.");
  }
  return key;
}

export async function rewriteArticleToSeoHtml(input: RewriteInput): Promise<RewriteOutput> {
  const apiKey = await getAiApiKeyFromDb();

  const prompt = [
    "Bạn là một nhà báo chuyên nghiệp người Việt chuyên viết bài review game MU Online. Bạn viết cho tạp chí game lâu năm, giọng văn đã được độc giả quen thuộc.",
    "Nhiệm vụ: viết lại bài báo gốc thành phiên bản hoàn toàn mới — giữ lại ý chính nhưng thể hiện bằng góc nhìn, ngôn từ và cấu trúc KHÁC HOÀN TOÀN so với bản gốc.",
    "",
    "QUAN TRỌNG — NẾU KHÔNG LÀM ĐÚNG, BÀI SẼ BỊ GOOGLE ĐÁNH LÀ NỘI DUNG AI VÀ KHÔNG INDEX ĐƯỢC:",
    "",
    "1) Trả về JSON hợp lệ với 4 trường: title (string), excerpt (string), html (string), seoKeywords (array string).",
    "2) html TUYỆT ĐỐI KHÔNG để văn bản thô. BẮT BUỘC bao bọc nội dung trong các thẻ <p>, <h2>, <h3>, <ul>, <li>. Mỗi đoạn văn phải là một thẻ <p> riêng biệt.",
    "3) html phải có đúng 1 thẻ <h1> và tối thiểu 3 thẻ <h2>. Có thể thêm <h3> nếu cần.",
    "4) TUYỆT ĐỐI KHÔNG DÙNG EMOJI — Không chèn bất kỳ emoji nào vào HTML. Vi phạm sẽ bị loại bỏ.",
    "5) Độ dài nội dung tối thiểu 1200 từ. Viết chi tiết, phân tích sâu, không viết hời hợt.",
    "6) Mỗi ý tưởng hoặc đoạn văn mới BẮT BUỘC phải nằm trong một thẻ <p> riêng. KHÔNG ĐƯỢC gộp nhiều đoạn vào một thẻ <p> duy nhất.",
    "7) Mở bài: Dẫn dắt tự nhiên, lôi cuốn như kể chuyện. Không dùng các cụm từ mồi chày.",
    "8) Thân bài: Phân chia các mục rõ ràng bằng thẻ <h2>. Mỗi mục gồm nhiều đoạn văn <p>. Dùng thực tế các danh sách <ul><li> để liệt kê tính năng.",
    "8) Kết bài: Gợi mở, đặt câu hỏi hoặc đưa ra lời khuyên thực tế. Không dùng cụm từ 'Kết luận'.",
    "9) TIÊU ĐỀ và MÔ TẢ NGẮN (excerpt) viết mới hoàn toàn, giật gân, cuốn hút và chuẩn SEO.",
    "10) GIỮ NGUYÊN TOÀN BỘ CÁC THẺ <img>: Tìm các thẻ <img> trong HTML gốc và chèn lại vào vị trí phù hợp trong bài viết mới để minh họa. KHÔNG ĐƯỢC XÓA ẢNH.",
    "11) KHÔNG RÚT NGẮN: Bài viết bài phải cực kỳ chi tiết, độ dài 1200 - 1800 từ.",
    `Tiêu đề gốc: ${input.title}`,
    `Nguồn: ${input.sourceUrl}`,
    "Nội dung HTML gốc:",
    input.sourceHtml.slice(0, 15000),
  ].join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mumoira.id.vn",
      "X-Title": "MuMoiRa AI Rewrite",
    },
    body: JSON.stringify({
      model: "google/gemma-4-26b-a4b-it",
      temperature: 0.65,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Bạn là nhà báo chuyên nghiệp Việt Nam viết bài về game MU Online. Giọng văn tự nhiên, sâu sắc, lôi cuốn. Không dùng emoji trong HTML. Trả về JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Không thể gọi AI (HTTP ${response.status}). ${errorText.slice(0, 240)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI không trả về nội dung.");
  }

  let parsed: { title?: string; excerpt?: string; html?: string; seoKeywords?: string[] };
  try {
    parsed = JSON.parse(content) as { title?: string; excerpt?: string; html?: string; seoKeywords?: string[] };
  } catch {
    throw new Error("AI trả dữ liệu không đúng định dạng JSON.");
  }

  const html = parsed.html?.trim();
  const keywords = (parsed.seoKeywords ?? []).map((item) => item.trim()).filter(Boolean);

  if (!html) {
    throw new Error("AI không trả về nội dung HTML.");
  }

  return {
    title: parsed.title?.trim() || "",
    excerpt: parsed.excerpt?.trim() || "",
    html,
    seoKeywords: keywords.join(", "),
  };
}
