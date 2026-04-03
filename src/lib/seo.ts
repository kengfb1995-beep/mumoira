import type { Metadata } from "next";
import type { Post, Server } from "@/db/schema";

export const siteConfig = {
  name: "Mu Mới Ra",
  description: "Danh bạ máy chủ MU Private mới nhất, cập nhật server VIP và tin tức MU Online.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultOgImage: "/og-image.jpg",
};

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
}): Metadata {
  const url = new URL(input.path ?? "/", siteConfig.url).toString();
  const image = input.image ?? siteConfig.defaultOgImage;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title: input.title,
      description: input.description,
      url,
      siteName: siteConfig.name,
      images: [{ url: image }],
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

export function buildArticleJsonLd(post: Pick<Post, "id" | "title" | "content" | "thumbnailUrl" | "createdAt" | "updatedAt">) {
  const articleUrl = new URL(`/tin-tuc/${post.id}`, siteConfig.url).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    mainEntityOfPage: articleUrl,
    image: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    articleBody: stripHtml(post.content).slice(0, 2500),
  };
}

export function buildServerJsonLd(server: Pick<Server, "id" | "name" | "version" | "exp" | "drop" | "websiteUrl" | "bannerUrl" | "openBetaDate">) {
  const serverUrl = new URL(`/server/${server.id}`, siteConfig.url).toString();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: server.name,
    applicationCategory: "Game",
    operatingSystem: "Windows",
    genre: "MMORPG",
    url: serverUrl,
    sameAs: server.websiteUrl,
    image: server.bannerUrl ?? undefined,
    description: `${server.name} - MU Private ${server.version}, EXP ${server.exp}, Drop ${server.drop}.`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
    },
    datePublished: server.openBetaDate ? new Date(server.openBetaDate).toISOString() : undefined,
  };
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
