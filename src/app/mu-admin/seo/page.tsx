"use client";

import { useState, useEffect } from "react";
import { Globe, Save } from "lucide-react";
import { withCsrfHeaders } from "@/lib/csrf-client";

type SeoForm = {
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  author: string;
  email: string;
  phone: string;
  facebook: string;
  youtube: string;
  zalo: string;
};

export default function SeoPage() {
  const [form, setForm] = useState<SeoForm>({
    title: "",
    description: "",
    keywords: "",
    ogImageUrl: "",
    author: "",
    email: "",
    phone: "",
    facebook: "",
    youtube: "",
    zalo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/seo");
        if (res.ok) {
          const data = (await res.json()) as Partial<SeoForm>;
          setForm((prev) => ({ ...prev, ...data }));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(field: keyof SeoForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings/seo", {
        method: "POST",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { message?: string; issues?: any[] };
      if (!res.ok) {
        if (data.issues && data.issues.length > 0) {
          const detail = data.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ");
          setError(`${data.message ?? "Lưu thất bại"}: ${detail}`);
        } else {
          setError(data.message ?? "Lưu thất bại");
        }
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError("Lỗi kết nối");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        Đang tải cấu hình SEO...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Globe className="h-7 w-7 text-amber-300" />
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100">Cấu hình SEO</h1>
          <p className="text-sm text-zinc-400">Thiết lập meta tags, JSON-LD schema, sitemap và liên hệ.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Meta Tags ── */}
        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Meta Tags </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Site Title</label>
              <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={70}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
              <p className="mt-1 text-xs text-zinc-500">{form.title.length}/70 ký tự — Google hiển thị tối đa 60</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Meta Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={160} rows={3}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
              <p className="mt-1 text-xs text-zinc-500">{form.description.length}/160 ký tự — Google hiển thị tối đa 155</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Từ khóa SEO (keywords)</label>
              <textarea value={form.keywords} onChange={(e) => update("keywords", e.target.value)} maxLength={500} rows={3}
                placeholder="mu moi ra, mu private, server mu, mu online, game mu, danh bạ mu"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
              <p className="mt-1 text-xs text-zinc-500">Phân cách bằng dấu phẩy. Tối đa 500 ký tự.</p>
            </div>
          </div>
        </section>

        {/* ── Open Graph ── */}
        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Open Graph & Social</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">OG Image URL</label>
              <input type="url" value={form.ogImageUrl} onChange={(e) => update("ogImageUrl", e.target.value)}
                placeholder="https://mumoira.id.vn/og-image.jpg"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
              <p className="mt-1 text-xs text-zinc-500">Kích thước khuyến nghị: 1200×630px. Dùng cho Facebook, Zalo share.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Tên tác giả / Tổ chức</label>
              <input type="text" value={form.author} onChange={(e) => update("author", e.target.value)} maxLength={100}
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
            </div>
          </div>
        </section>

        {/* ── Liên hệ ── */}
        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Thông tin liên hệ</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email liên hệ</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                placeholder="contact@mumoira.id.vn"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Số điện thoại</label>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                placeholder="0901 234 567"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
            </div>
          </div>
        </section>

        {/* ── Social Links ── */}
        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Mạng xã hội</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Facebook (nút nổi góc phải)</label>
              <input type="url" value={form.facebook} onChange={(e) => update("facebook", e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">YouTube</label>
              <input type="url" value={form.youtube} onChange={(e) => update("youtube", e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Zalo (nút nổi góc phải)</label>
              <input type="text" value={form.zalo} onChange={(e) => update("zalo", e.target.value)}
                placeholder="https://zalo.me/0901234567 hoặc số điện thoại"
                className="w-full rounded-md border border-amber-500/30 bg-black/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400/70 focus:outline-none" />
              <p className="mt-1 text-xs text-zinc-500">Dùng cho icon Zalo cố định màn hình. Facebook/Zalo để trống thì ẩn nút tương ứng.</p>
            </div>
          </div>
        </section>

        {/* ── Robots & Sitemap ── */}
        <section className="rounded-xl border border-amber-500/20 bg-black/25 p-5">
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Robots & Sitemap</h2>
          <div className="space-y-2 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-md border border-amber-500/10 bg-black/30 p-3">
              <span>Sitemap XML</span>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">/sitemap.xml</a>
            </div>
            <div className="flex items-center justify-between rounded-md border border-amber-500/10 bg-black/30 p-3">
              <span>Robots.txt</span>
              <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">/robots.txt</a>
            </div>
            <div className="flex items-center justify-between rounded-md border border-amber-500/10 bg-black/30 p-3">
              <span>Google Index</span>
              <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-semibold text-emerald-300">Index OK</span>
            </div>
          </div>
        </section>

        {/* ── Save Button ── */}
        {error && (
          <div className="rounded-md border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit"
            className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-900/40 px-5 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-900/60">
            <Save className="h-4 w-4" />
            Lưu toàn bộ SEO
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Đã lưu thành công!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
