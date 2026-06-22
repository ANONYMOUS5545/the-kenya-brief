import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import { getSiteUrl } from "@/lib/site-url";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import NewsInitializer from "@/components/NewsInitializer";

const siteUrl = getSiteUrl();
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Kenya Brief - Breaking News, Politics, Business & More",
    template: "%s | The Kenya Brief",
  },
  description: "The Kenya Brief is Kenya's trusted source for breaking news, politics, business, sports, entertainment, and lifestyle coverage.",
  keywords: ["Kenya news", "breaking news Kenya", "Nairobi", "Kenya politics", "Kenya business", "Kenya sports"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: "The Kenya Brief",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "The Kenya Brief" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@KenyaBrief",
    creator: "@KenyaBrief",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="alternate" type="application/rss+xml" title="The Kenya Brief RSS" href="/rss.xml" />
        <meta name="theme-color" content="#C8102E" />
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        )}
        {process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && (
          <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              name: "The Kenya Brief",
              url: siteUrl,
              logo: `${siteUrl}/og-image.svg`,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Kenya Brief",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          <NewsInitializer />
          <AnalyticsScripts gaId={gaId} />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#111827", color: "#fff", fontSize: "14px" },
              success: { iconTheme: { primary: "#16A34A", secondary: "#fff" } },
              error: { iconTheme: { primary: "#C8102E", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
