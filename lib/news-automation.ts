export const NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES = 4;
export const NEWS_AUTOMATION_DEFAULT_CACHE_MINUTES = 4;
export const NEWS_AUTOMATION_CRON_SCHEDULE = "0 0 * * *";
export const PUBLIC_NEWS_AUTHOR_NAME = "Kenya Brief";
export const NEWS_AUTOMATION_AUTHOR_EMAIL = "automation@kenyabrief.co.ke";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Breaking News": ["breaking", "urgent", "developing", "live"],
  Politics: ["president", "parliament", "senate", "mp", "governor", "election", "government", "cabinet", "court"],
  Business: ["business", "market", "economy", "shilling", "bank", "trade", "tax", "revenue", "investment"],
  Technology: ["technology", "tech", "startup", "ai", "digital", "software", "data", "cyber", "mobile"],
  Sports: ["sport", "football", "rugby", "athletics", "marathon", "league", "match", "team", "coach"],
  Entertainment: ["entertainment", "music", "film", "artist", "festival", "celebrity", "show", "culture"],
  Health: ["health", "hospital", "doctor", "medicine", "sha", "disease", "patient", "clinic"],
  Education: ["education", "school", "university", "teacher", "student", "exam", "kuccps", "tvet"],
  Environment: ["environment", "climate", "rain", "flood", "forest", "wildlife", "drought", "conservation"],
  Counties: ["county", "counties", "nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "kiambu"],
};

export interface FetchedNewsItem {
  title: string;
  summary?: string | null;
  publishedAt?: Date | string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
}

function sentenceCase(text: string) {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/["'\u201c\u201d\u2018\u2019]/g, "")
    .replace(/\s[-\u2013\u2014]\s.+$/, "")
    .trim();

  if (!cleaned) return "Kenya Brief news update";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function rewriteCommonNewsTerms(text: string) {
  return text
    .replace(/\bsays\b/gi, "announces")
    .replace(/\bsaid\b/gi, "announced")
    .replace(/\bset to\b/gi, "expected to")
    .replace(/\bslams\b/gi, "criticises")
    .replace(/\bbacks\b/gi, "supports")
    .replace(/\beyes\b/gi, "targets")
    .replace(/\bseeks\b/gi, "pushes for")
    .replace(/\bto probe\b/gi, "to investigate")
    .replace(/\brow\b/gi, "dispute")
    .replace(/\bshake-up\b/gi, "changes")
    .replace(/\bboost\b/gi, "lift");
}

function trimToSentence(text: string, maxLength: number) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;

  const shortened = cleaned.slice(0, maxLength - 3).trim();
  const lastBreak = Math.max(shortened.lastIndexOf("."), shortened.lastIndexOf(";"), shortened.lastIndexOf(","));
  return `${shortened.slice(0, lastBreak > 80 ? lastBreak : shortened.length).trim()}...`;
}

export function classifyNewsCategory(item: Pick<FetchedNewsItem, "title" | "summary">) {
  const haystack = `${item.title} ${item.summary || ""}`.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => haystack.includes(keyword))
  );

  return match?.[0] || "Breaking News";
}

export function createKenyaBriefTitle(title: string) {
  return trimToSentence(rewriteCommonNewsTerms(sentenceCase(title)), 90);
}

export function createKenyaBriefSummary(item: Pick<FetchedNewsItem, "title" | "summary">) {
  const basis = item.summary || item.title;
  const cleaned = rewriteCommonNewsTerms(sentenceCase(basis))
    .replace(/\baccording to\b.+$/i, "")
    .replace(/\bread more\b.+$/i, "")
    .trim();

  return trimToSentence(cleaned, 220) || "The Kenya Brief is tracking this developing story and will update readers as more details become available.";
}
