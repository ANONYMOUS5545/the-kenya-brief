"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewsRefreshOnOpen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/news/open-refresh", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.success && Number(data.imported || 0) > 0) {
          router.refresh();
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
