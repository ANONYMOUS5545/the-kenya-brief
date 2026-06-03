"use client";

import { useEffect } from "react";

export default function NewsRefreshOnOpen() {
  useEffect(() => {
    fetch("/api/news/open-refresh", { cache: "no-store" }).catch(() => {});
  }, []);

  return null;
}
