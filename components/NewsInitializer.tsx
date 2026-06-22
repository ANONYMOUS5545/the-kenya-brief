"use client";

import { useEffect } from "react";

export default function NewsInitializer() {
  useEffect(() => {
    let cancelled = false;

    const initializeNews = async () => {
      try {
        const response = await fetch("/api/news/sync", {
          method: "GET",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        });

        if (!cancelled && response.ok) {
          const data = await response.json();
          console.log("News initialized:", data);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("News initialization in progress...");
        }
      }
    };

    // Initialize news immediately on app startup
    initializeNews();

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(initializeNews, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}
