import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FeedItem } from "@/lib/news-ingestion";

const CACHE_DIR = path.join(process.cwd(), ".news-cache");
const CACHE_FILE = path.join(CACHE_DIR, "articles.json");
const MAX_STORED_ITEMS = 600;
const MEMORY_TTL_MS = 60_000;

let memoryCache: { items: FeedItem[]; loadedAt: number } | null = null;

type StoredFeedItem = Omit<FeedItem, "publishedAt"> & { publishedAt: string };

function keyFor(item: Pick<FeedItem, "link" | "title">) {
  return (item.link || item.title).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toStored(item: FeedItem): StoredFeedItem {
  return { ...item, publishedAt: item.publishedAt.toISOString() };
}

function fromStored(item: StoredFeedItem): FeedItem {
  return { ...item, publishedAt: new Date(item.publishedAt) };
}

export async function readNewsCache() {
  if (memoryCache && Date.now() - memoryCache.loadedAt < MEMORY_TTL_MS) {
    return memoryCache.items;
  }

  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const stored = JSON.parse(raw) as StoredFeedItem[];
    const items = stored
      .map(fromStored)
      .filter((item) => item.title && item.link)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    memoryCache = { items, loadedAt: Date.now() };
    return items;
  } catch {
    return [];
  }
}

export async function writeNewsCache(items: FeedItem[]) {
  const existing = await readNewsCache();
  const map = new Map<string, FeedItem>();

  [...items, ...existing].forEach((item) => {
    const key = keyFor(item);
    if (!map.has(key)) map.set(key, item);
  });

  const merged = Array.from(map.values())
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, MAX_STORED_ITEMS);

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(merged.map(toStored), null, 2), "utf8");
  memoryCache = { items: merged, loadedAt: Date.now() };
  return merged;
}
