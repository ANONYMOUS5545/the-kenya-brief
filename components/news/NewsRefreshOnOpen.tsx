"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewsRefreshOnOpen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const storageKey = "kenya-brief-news-refresh-at";
    const minAgeMs = 5 * 60 * 1000; // Reduced from 10 to 5 minutes for more frequent updates

    const runRefresh = () => {
      const lastRefresh = Number(window.sessionStorage.getItem(storageKey) || 0);
      if (Number.isFinite(lastRefresh) && Date.now() - lastRefresh < minAgeMs) return;

      window.sessionStorage.setItem(storageKey, String(Date.now()));
      fetch("/api/news/open-refresh", { cache: "no-store", keepalive: true })
        .then((response) => response.json())
        .then((data) => {
          if (!cancelled && data?.success && Number(data.imported || 0) > 0) {
            router.refresh();
          }
        })
        .catch(() => {});
    };

    const timeout = window.setTimeout(runRefresh, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [router]);

  return null;
}
