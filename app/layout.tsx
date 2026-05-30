import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "The Kenya Brief – Breaking News, Politics, Business & More",
    template: "%s | The Kenya Brief",
  },
  description: "The Kenya Brief is Kenya's trusted source for breaking news, politics, business, sports, entertainment, and lifestyle coverage.",
  keywords: ["Kenya news", "breaking news Kenya", "Nairobi", "Kenya politics", "Kenya business", "Kenya sports"],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "The Kenya Brief",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#C8102E" />
      </head>
      <body>
        <Providers>
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
