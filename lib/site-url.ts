export const PRODUCTION_SITE_URL = "https://the-kenya-brief.vercel.app";
export const DEVELOPMENT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return DEVELOPMENT_SITE_URL;
}
