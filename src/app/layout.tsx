import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UiProvider } from "@/components/providers/ui-provider";
import { AppShell } from "@/components/layout/app-shell";
import { buildOrganizationJsonLd, buildWebSiteJsonLd, getSeoConfig, siteConfig } from "@/lib/seo";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoConfig();

  return {
    title: {
      default: seo.title,
      template: `%s | ${seo.title}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: siteConfig.url,
    },
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [{ url: new URL(seo.ogImage, siteConfig.url).toString(), width: 1200, height: 630 }],
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [new URL(seo.ogImage, siteConfig.url).toString()],
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
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
      apple: "/icon.svg",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = buildOrganizationJsonLd();
  const websiteSchema = buildWebSiteJsonLd();

  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([orgSchema, websiteSchema]),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <UiProvider>
          <AppShell>{children}</AppShell>
        </UiProvider>
      </body>
    </html>
  );
}
