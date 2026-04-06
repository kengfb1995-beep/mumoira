import type { Metadata } from "next";
import type { Post, Server } from "@/db/schema";
import { getSecureSettings } from "@/lib/secure-settings";

const defaultSiteUrl = "https://mumoira.id.vn";

function resolvePublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return defaultSiteUrl;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return defaultSiteUrl;
    return u.origin;
  } catch {
    return defaultSiteUrl;
  }
}

export const siteConfig = {
  name: "Mu Mới Ra",
  description: "Danh bạ máy chủ MU Private mới nhất, cập nhật server VIP và tin tức MU Online.",
  url: resolvePublicSiteUrl(),
  defaultOgImage: "/og-image.jpg",
};

export async function getSeoConfig() {
  const keys = [
    "SEO_SITE_TITLE",
    "SEO_SITE_DESCRIPTION",
    "SEO_SITE_KEYWORDS",
    "SEO_OG_IMAGE_URL",
    "SEO_SITE_AUTHOR",
    "SEO_SITE_EMAIL",
    "SEO_SITE_PHONE",
    "SEO_SOCIAL_LINKS",
  ];

  const results = await getSecureSettings(keys);

  const title = results["SEO_SITE_TITLE"];
  const description = results["SEO_SITE_DESCRIPTION"];
  const keywords = results["SEO_SITE_KEYWORDS"];
  const ogImage = results["SEO_OG_IMAGE_URL"];
  const author = results["SEO_SITE_AUTHOR"];
  const email = results["SEO_SITE_EMAIL"];
  const phone = results["SEO_SITE_PHONE"];
  const social = results["SEO_SOCIAL_LINKS"];

  return {
    title: title ?? siteConfig.name,
    description: description ?? siteConfig.description,
    keywords: keywords ?? "mu moi ra, mu private, server mu, mu online, game mu",
    ogImage: ogImage ?? siteConfig.defaultOgImage,
    author: author ?? siteConfig.name,
    email: email ?? "contact@mumoira.id.vn",
    phone: phone ?? "",
    social: social ? (JSON.parse(social) as { facebook?: string; youtube?: string; zalo?: string }) : {},
  };
}

function resolveAbsoluteImageUrl(image: string | null | undefined) {
  const picked = image ?? siteConfig.defaultOgImage;
  try {
    return new URL(picked, siteConfig.url).toString();
  } catch {
    return new URL(siteConfig.defaultOgImage, siteConfig.url).toString();
  }
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  keywords?: string;
}): Metadata {
  const url = new URL(input.path ?? "/", siteConfig.url).toString();
  const image = resolveAbsoluteImageUrl(input.image);

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title: input.title,
      description: input.description,
      url,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630 }],
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function buildFullMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  keywords?: string;
  type?: "website" | "article";
  publishedAt?: Date;
  modifiedAt?: Date;
  author?: string;
}): Metadata {
  const meta = buildPageMetadata(input);
  if (input.type === "article") {
    meta.openGraph = {
      ...meta.openGraph,
      type: "article",
      publishedTime: input.publishedAt?.toISOString(),
      modifiedTime: input.modifiedAt?.toISOString(),
      authors: input.author ? [input.author] : undefined,
    } as Metadata["openGraph"];
  }
  return meta;
}

// ── JSON-LD Schemas ──────────────────────────────────────────────────────────

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/images/logo-mumoira.png`,
    },
    sameAs: [
      "https://www.facebook.com/mumoira",
      "https://www.youtube.com/@mumoira",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@mumoira.id.vn",
      availableLanguage: "Vietnamese",
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/tin-tuc?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "vi",
  };
}

export function buildWebPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url: new URL(input.path, siteConfig.url).toString(),
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    about: { "@id": `${siteConfig.url}/#organization` },
    image: input.image ? { "@type": "ImageObject", url: input.image } : undefined,
    inLanguage: "vi",
  };
}

export function buildArticleJsonLd(
  post: Pick<Post, "id" | "title" | "slug" | "content" | "thumbnailUrl" | "createdAt" | "updatedAt">,
  keywords?: string
) {
  const slug = resolvePostSlugForSeo(post.slug, post.title);
  const articleUrl = new URL(`/tin-tuc/${post.id}-${slug}`, siteConfig.url).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": articleUrl,
    headline: post.title,
    description: stripHtml(post.content).slice(0, 300),
    datePublished: optionalDateToIso8601(post.createdAt) ?? new Date(0).toISOString(),
    dateModified: optionalDateToIso8601(post.updatedAt) ?? optionalDateToIso8601(post.createdAt) ?? new Date(0).toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    image: post.thumbnailUrl
      ? { "@type": "ImageObject", url: post.thumbnailUrl, width: 1200, height: 630 }
      : undefined,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    wordCount: stripHtml(post.content).split(/\s+/).filter(Boolean).length,
    articleSection: "Tin tức MU Online",
    keywords: keywords ?? "",
    inLanguage: "vi",
  };
}

export function buildServerJsonLd(
  server: Pick<
    Server,
    "id" | "name" | "version" | "exp" | "drop" | "websiteUrl" | "bannerUrl" | "openBetaDate" | "content"
  > & { slug?: string }
) {
  const slugPart = server.slug ? `-${server.slug}` : "";
  const serverUrl = new URL(`/server/${server.id}${slugPart}`, siteConfig.url).toString();
  const description = `${server.name} - MU Private phiên bản ${server.version}, EXP ${server.exp}, Drop ${server.drop}. ${stripHtml(server.content ?? "").slice(0, 200)}`;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": serverUrl,
    name: server.name,
    url: serverUrl,
    description,
    applicationCategory: "Game",
    operatingSystem: "Windows",
    genre: "MMORPG",
    gameLocation: { "@type": "Place", name: "Việt Nam" },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
    },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    image: server.bannerUrl ?? undefined,
    screenshot: server.bannerUrl ?? undefined,
    datePublished: optionalDateToIso8601(server.openBetaDate),
    softwareVersion: server.version,
    installUrl: server.websiteUrl,
    requirements: `EXP: ${server.exp} | Drop: ${server.drop}`,
    inLanguage: "vi",
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.url, siteConfig.url).toString(),
    })),
  };
}

// ── Utilities ────────────────────────────────────────────────────────────────

function resolvePostSlugForSeo(slug: string, title: string) {
  if (slug && slug !== "mu-moi-ra") return slug;
  return slugifyVietnamese(title) || "mu-moi-ra";
}

export function slugifyVietnamese(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildPostPath(postId: number | string, slug: string) {
  const safeSlug = slugifyVietnamese(slug) || "mu-moi-ra";
  return `/tin-tuc/${postId}-${safeSlug}`;
}

export function buildServerPath(serverId: number, serverSlug: string) {
  const safeSlug = slugifyVietnamese(serverSlug || String(serverId));
  return `/server/${serverId}-${safeSlug}`;
}

export function buildPostSlugFromTitle(title: string) {
  return slugifyVietnamese(title) || "mu-moi-ra";
}

export function buildServerSlugFromName(name: string) {
  return slugifyVietnamese(name) || "server-mu";
}

export function parsePostIdFromSlug(value: string) {
  const [idPart] = value.split("-");
  const parsed = Number(idPart);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/** Dynamic segment `/server/[id]` dạng `42-ten-server` — lấy phần số đầu (giống tin-tức). */
export function parseServerIdFromSlug(value: string): number | null {
  return parsePostIdFromSlug(value);
}

/** Tránh Invalid Date làm `.toISOString()` ném lỗi (500 trên trang server/tin tức). */
export function optionalDateToIso8601(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const d = value instanceof Date ? value : new Date(value as string | number);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return undefined;
  return d.toISOString();
}

export function stripHtml(html: string) {
  const s = typeof html === "string" ? html : String(html ?? "");
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
