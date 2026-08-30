import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/mu-admin/", "/api/", "/tai-khoan/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/mu-admin/", "/api/", "/tai-khoan/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
