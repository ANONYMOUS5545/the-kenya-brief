import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Optimize image loading and formats
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "the-kenya-brief.vercel.app"],
    },
  },
  compress: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
};

export default nextConfig;
