export const NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES = 1440;
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
}

function sentenceCase(text: string) {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/["'“”‘’]/g, "")
    .replace(/\s[-–—]\s.+$/, "")
    .trim();

  if (!cleaned) return "Kenya Brief news update";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function classifyNewsCategory(item: Pick<FetchedNewsItem, "title" | "summary">) {
  const haystack = `${item.title} ${item.summary || ""}`.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => haystack.includes(keyword))
  );

  return match?.[0] || "Breaking News";
}

export function createKenyaBriefTitle(title: string) {
  const cleaned = sentenceCase(title);
  return cleaned.length > 90 ? `${cleaned.slice(0, 87).trim()}...` : cleaned;
}

export function createKenyaBriefSummary(item: Pick<FetchedNewsItem, "title" | "summary">) {
  const basis = item.summary || item.title;
  const cleaned = sentenceCase(basis)
    .replace(/\baccording to\b.+$/i, "")
    .trim();

  return cleaned.length > 220 ? `${cleaned.slice(0, 217).trim()}...` : cleaned;
}
