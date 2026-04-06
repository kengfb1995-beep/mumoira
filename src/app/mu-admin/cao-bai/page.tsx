"use client";

import { useMemo, useState } from "react";
import { Globe, Loader2, Save, Sparkles, Wand, Share2, Tag, User, Layout, Flame, Star, CheckCircle2 } from "lucide-react";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { useUiNotify } from "@/components/providers/ui-provider";

type PreviewResult = {
  title: string;
  content: string;
  description: string;
  images: string[];
  sourceUrl: string;
};

export default function IntegratedPostEditor() {
  const notify = useUiNotify();

  // Scraper source
  const [sourceUrl, setSourceUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    contentHtml: "",
    thumbnailUrl: "",
    innerImages: "",
    category: "Social",
    author: "GAMEVIET",
    tags: "",
    isHot: false,
    isFeatured: false,
    status: "published" as "published" | "draft",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    originalUrl: "",
  });

  function update(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function slugify(raw: string) {
    return raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleScrape() {
    if (!sourceUrl.trim()) return;
    setIsScraping(true);
    try {
      const res = await fetch("/api/admin/cao-bai/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl.trim() }),
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.message || "Lỗi cào bài");

      setFormData((prev) => ({
        ...prev,
        title: data.title || "",
        slug: slugify(data.title || ""),
        excerpt: (data.description || "").slice(0, 300),
        contentHtml: data.content || "",
        thumbnailUrl: data.images?.[0] ?? "",
        innerImages: (data.images || []).join("\n"),
        originalUrl: sourceUrl.trim(),
      }));
      notify({ type: "success", title: "Đã cào dữ liệu thành công" });
    } catch (err: any) {
      notify({ type: "error", title: err.message });
    } finally {
      setIsScraping(false);
    }
  }

  async function handleAiRewrite() {
    if (!formData.contentHtml) {
      notify({ type: "error", title: "Cần có nội dung để rewrite" });
      return;
    }
    setIsRewriting(true);
    try {
      const res = await fetch("/api/admin/cao-bai/rewrite", {
        method: "POST",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: formData.title,
          sourceHtml: formData.contentHtml,
          sourceUrl: formData.originalUrl,
        }),
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.message || "AI rewrite thất bại");

      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        slug: data.title ? slugify(data.title) : prev.slug,
        excerpt: data.excerpt || prev.excerpt,
        contentHtml: data.html ?? prev.contentHtml,
        seoKeywords: data.seoKeywords ?? prev.seoKeywords,
        tags: data.seoKeywords ?? prev.tags,
        seoTitle: data.title || prev.seoTitle || prev.title,
        seoDescription: data.excerpt || prev.seoDescription || (prev.excerpt || "").slice(0, 160),
      }));
      notify({ type: "success", title: "AI đã viết lại và tối ưu SEO" });
    } catch (err: any) {
      notify({ type: "error", title: err.message });
    } finally {
      setIsRewriting(false);
    }
  }

  async function handleSave() {
    if (!formData.title || !formData.contentHtml) {
      notify({ type: "error", title: "Vui lòng nhập tiêu đề và nội dung" });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/cao-bai/save", {
        method: "POST",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(formData),
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.message || "Lưu thất bại");

      notify({ type: "success", title: "Đã tạo bài viết thành công" });
    } catch (err: any) {
      notify({ type: "error", title: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layout className="h-7 w-7 text-amber-300" />
          <h1 className="text-2xl font-extrabold text-amber-100">Thêm bài viết mới</h1>
        </div>
      </header>

      {/* --- Top Scraper Bar --- */}
      <div className="flex gap-2 rounded-xl border border-amber-500/25 bg-black/40 p-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="URL bài gốc để cào..."
            className="w-full rounded-md border border-amber-500/30 bg-black/50 pl-10 pr-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <button
          onClick={handleScrape}
          disabled={isScraping || !sourceUrl}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Cào bài + ảnh
        </button>
        <button
          onClick={handleAiRewrite}
          disabled={isRewriting || !formData.contentHtml}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isRewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI viết lại + SEO
        </button>
      </div>

      {/* --- Main Form --- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Main content group */}
          <section className="space-y-4 rounded-xl border border-amber-500/20 bg-black/20 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Tiêu đề *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  update("title", e.target.value);
                  update("slug", slugify(e.target.value));
                }}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Slug (URL)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => update("slug", e.target.value)}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm font-mono text-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Mô tả ngắn / Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                rows={2}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Nội dung (HTML) *</label>
              <textarea
                value={formData.contentHtml}
                onChange={(e) => update("contentHtml", e.target.value)}
                rows={20}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:border-amber-400/70 focus:outline-none"
              />
            </div>
          </section>

          {/* Media & Images */}
          <section className="space-y-4 rounded-xl border border-amber-500/20 bg-black/20 p-5">
            <h2 className="text-sm font-bold text-amber-300">Hình ảnh</h2>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Ảnh đại diện (URL)</label>
              <input
                type="text"
                value={formData.thumbnailUrl}
                onChange={(e) => update("thumbnailUrl", e.target.value)}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Ảnh trong bài (mỗi URL một dòng)</label>
              <textarea
                value={formData.innerImages}
                onChange={(e) => update("innerImages", e.target.value)}
                rows={4}
                placeholder="https://..."
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm font-mono text-zinc-100"
              />
            </div>
          </section>

          {/* SEO Metadata */}
          <section className="space-y-4 rounded-xl border border-amber-500/20 bg-black/20 p-5">
            <h2 className="text-sm font-bold text-amber-300">SEO Setting</h2>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Meta Title (SEO)</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => update("seoTitle", e.target.value)}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Meta Description (SEO)</label>
              <textarea
                value={formData.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Từ khóa SEO</label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => update("seoKeywords", e.target.value)}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100"
              />
            </div>
          </section>
        </div>

        {/* Sidebar settings */}
        <aside className="space-y-6">
          <section className="space-y-4 rounded-xl border border-amber-500/20 bg-black/25 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Chuyên mục</label>
              <select
                value={formData.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100"
              >
                <option value="Social">Social (Social)</option>
                <option value="News">Tin tức (News)</option>
                <option value="Event">Sự kiện (Event)</option>
                <option value="Guide">Hướng dẫn (Guide)</option>
                <option value="Giftcode">Giftcode</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Game giftcode</label>
              <select className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-500" disabled>
                <option>-- Không hiện ô nhận mã --</option>
              </select>
              <p className="mt-1 text-[10px] italic text-amber-500/80">Chọn chuyên mục GIFTCODE để đồng bộ game.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Tác giả</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => update("author", e.target.value)}
                  className="w-full rounded-md border border-amber-500/30 bg-black/50 pl-8 pr-3.5 py-2 text-sm text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Tags</label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="Cách nhau bởi dấu phẩy"
                  className="w-full rounded-md border border-amber-500/30 bg-black/50 pl-8 pr-3.5 py-2 text-sm text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={formData.isHot}
                  onChange={(e) => update("isHot", e.target.checked)}
                  className="rounded border-amber-500/30 bg-black"
                />
                <Flame className={`h-4 w-4 ${formData.isHot ? "text-orange-500" : "text-zinc-600"}`} />
                Tin Hot
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => update("isFeatured", e.target.checked)}
                  className="rounded border-amber-500/30 bg-black"
                />
                <Star className={`h-4 w-4 ${formData.isFeatured ? "text-yellow-500" : "text-zinc-600"}`} />
                Nổi bật
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100"
              >
                <option value="published">Xuất bản</option>
                <option value="draft">Nháp</option>
              </select>
            </div>
          </section>

          <footer className="sticky top-6 space-y-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title || !formData.contentHtml}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Tạo bài viết
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
            >
              Hủy / Làm mới
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}
