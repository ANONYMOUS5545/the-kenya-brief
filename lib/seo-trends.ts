import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cleanNewsText, hasUsableNewsText } from "@/lib/news-automation";

const CACHE_DIR = path.join(process.cwd(), ".news-cache");
const CACHE_FILE = path.join(CACHE_DIR, "seo-trends.json");
const TREND_TIMEOUT_MS = 4500;
const MAX_STORED_TRENDS = 160;
const MEMORY_TTL_MS = 5 * 60_000;
const BLOCKED_SEO_TERMS = /\b(attorney|lawyer|casino|porn|payday|coupon|promo code)\b/i;

export type SeoTrend = {
  term: string;
  source: "Google Trends" | "Google News";
  geo: "KE" | "US" | "GB" | "ZA" | "NG";
  traffic?: string | null;
  publishedAt: string;
  relatedTitles: string[];
  url: string;
};

let memoryCache: { trends: SeoTrend[]; loadedAt: number } | null = null;

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pickTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? cleanNewsText(decodeEntities(match[1])) : "";
}

function pickRepeatedTags(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
    .map((match) => cleanNewsText(decodeEntities(match[1])))
    .filter((value) => hasUsableNewsText(value, 8));
}

function normalizeKey(value: string) {
  return cleanNewsText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeTrendTerm(value: string) {
  return cleanNewsText(value).replace(/\s[-\u2013\u2014]\s.+$/, "");
}

function isAllowedTrendTerm(value: string, minLength = 3) {
  const term = normalizeTrendTerm(value);
  return hasUsableNewsText(term, minLength) && !BLOCKED_SEO_TERMS.test(term);
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TREND_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: { "User-Agent": "The Kenya Brief SEO trends bot" },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGoogleTrendsRss(geo: SeoTrend["geo"]) {
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) return [];

  const xml = await response.text();
  return (xml.match(/<item[\s\S]*?<\/item>/gi) || [])
    .map((item): SeoTrend | null => {
      const term = pickTag(item, "title");
      if (!isAllowedTrendTerm(term, 3)) return null;

      return {
        term: normalizeTrendTerm(term),
        source: "Google Trends",
        geo,
        traffic: pickTag(item, "ht:approx_traffic") || null,
        publishedAt: pickTag(item, "pubDate") || new Date().toISOString(),
        relatedTitles: pickRepeatedTags(item, "ht:news_item_title").slice(0, 5),
        url,
      };
    })
    .filter((item): item is SeoTrend => Boolean(item));
}

async function fetchGoogleNewsKenya() {
  const url = "https://news.google.com/rss?hl=en-KE&gl=KE&ceid=KE:en";
  const response = await fetchWithTimeout(url);
  if (!response.ok) return [];

  const xml = await response.text();
  return (xml.match(/<item[\s\S]*?<\/item>/gi) || [])
    .map((item): SeoTrend | null => {
      const title = pickTag(item, "title");
      if (!isAllowedTrendTerm(title, 8)) return null;

      return {
        term: normalizeTrendTerm(title),
        source: "Google News",
        geo: "KE",
        traffic: null,
        publishedAt: pickTag(item, "pubDate") || new Date().toISOString(),
        relatedTitles: [title],
        url,
      };
    })
    .filter((item): item is SeoTrend => Boolean(item))
    .slice(0, 40);
}

export async function readSeoTrendCache() {
  if (memoryCache && Date.now() - memoryCache.loadedAt < MEMORY_TTL_MS) {
    return memoryCache.trends;
  }

  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const trends = (JSON.parse(raw) as SeoTrend[])
      .map((trend) => ({ ...trend, term: normalizeTrendTerm(trend.term) }))
      .filter((trend) => isAllowedTrendTerm(trend.term, 3))
      .slice(0, MAX_STORED_TRENDS);
    memoryCache = { trends, loadedAt: Date.now() };
    return trends;
  } catch {
    return [];
  }
}

export async function writeSeoTrendCache(trends: SeoTrend[]) {
  const existing = await readSeoTrendCache();
  const map = new Map<string, SeoTrend>();

  [...trends, ...existing].forEach((trend) => {
    const normalized = { ...trend, term: normalizeTrendTerm(trend.term) };
    const key = `${normalized.source}:${normalized.geo}:${normalizeKey(normalized.term)}`;
    if (!map.has(key) && isAllowedTrendTerm(normalized.term, 3)) map.set(key, normalized);
  });

  const merged = Array.from(map.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, MAX_STORED_TRENDS);

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(merged, null, 2), "utf8");
  memoryCache = { trends: merged, loadedAt: Date.now() };
  return merged;
}

export async function fetchAndCacheSeoTrends() {
  const fetched = await Promise.allSettled([
    fetchGoogleTrendsRss("KE"),
    fetchGoogleTrendsRss("US"),
    fetchGoogleTrendsRss("GB"),
    fetchGoogleTrendsRss("ZA"),
    fetchGoogleTrendsRss("NG"),
    fetchGoogleNewsKenya(),
  ]);

  const trends = fetched.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  return writeSeoTrendCache(trends);
}

export function trendTerms(trends: SeoTrend[]) {
  return trends.map((trend) => trend.term).filter((term) => isAllowedTrendTerm(term, 3));
}

export function scoreTextAgainstTrends(text: string, trends: SeoTrend[]) {
  const haystack = normalizeKey(text);
  if (!haystack) return 0;

  return trends.reduce((score, trend) => {
    const term = normalizeKey(trend.term);
    if (!term || term.length < 3) return score;
    const multiplier = trend.geo === "KE" ? 3 : 1;
    return score + (haystack.includes(term) || term.includes(haystack.slice(0, 48)) ? multiplier : 0);
  }, 0);
}
